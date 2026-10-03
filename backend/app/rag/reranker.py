"""
Lightweight hybrid reranker for HR365.

Ranking combines:

    55% semantic/vector similarity
    30% lexical query overlap
    15% source authority

Source authority matters because HR365 explicitly distinguishes
authoritative policy documents from reference documents such as
the HR FAQ.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import List, Tuple

from app.models.document import Chunk


_TOKEN_RE = re.compile(
    r"[a-zA-Z0-9]+"
)


SOURCE_AUTHORITY = {
    "01_employee_handbook.md": 1.00,
    "02_attendance_policy.md": 1.00,
    "03_leave_policy.md": 1.00,
    "04_remote_work_policy.md": 1.00,
    "05_code_of_conduct.md": 1.00,
    "06_benefits_policy.md": 1.00,
    "07_payroll_policy.md": 1.00,
    "08_it_security_policy.md": 1.00,
    "09_hr_faq.md": 0.85,
    "10_workplace_safety_and_grievance.md": 1.00,
    "11_company_notices.md": 0.90,
}


def _tokenize(
    text: str,
) -> set[str]:
    return {
        token.lower()
        for token in _TOKEN_RE.findall(
            text or ""
        )
    }


def _source_name(
    source: str,
) -> str:
    return Path(
        source or ""
    ).name


def _authority_score(
    source: str,
) -> float:
    filename = _source_name(source)

    return SOURCE_AUTHORITY.get(
        filename,
        0.75,
    )


class LexicalReranker:
    """
    Hybrid reranker.

    Vector similarity provides semantic relevance.
    Lexical overlap rewards direct terminology matches.
    Source authority gives authoritative HR policies priority.
    """

    def __init__(
        self,
        vector_weight: float = 0.55,
        lexical_weight: float = 0.30,
        authority_weight: float = 0.15,
    ) -> None:
        total = (
            vector_weight
            + lexical_weight
            + authority_weight
        )

        if total <= 0:
            vector_weight = 0.55
            lexical_weight = 0.30
            authority_weight = 0.15
            total = 1.0

        self.vector_weight = (
            vector_weight / total
        )

        self.lexical_weight = (
            lexical_weight / total
        )

        self.authority_weight = (
            authority_weight / total
        )

    def rerank(
        self,
        query: str,
        results: List[
            Tuple[Chunk, float]
        ],
        top_n: int = 5,
    ) -> List[
        Tuple[Chunk, float]
    ]:
        if not results:
            return []

        query_terms = _tokenize(query)

        scored: List[
            Tuple[Chunk, float]
        ] = []

        for chunk, vector_score in results:
            chunk_terms = _tokenize(
                chunk.text
            )

            if (
                query_terms
                and chunk_terms
            ):
                lexical = (
                    len(
                        query_terms
                        & chunk_terms
                    )
                    / len(query_terms)
                )
            else:
                lexical = 0.0

            authority = _authority_score(
                chunk.source
            )

            combined = (
                self.vector_weight
                * float(vector_score)
                + self.lexical_weight
                * float(lexical)
                + self.authority_weight
                * float(authority)
            )

            scored.append(
                (
                    chunk,
                    combined,
                )
            )

        scored.sort(
            key=lambda item: item[1],
            reverse=True,
        )

        return scored[
            : max(1, top_n)
        ]
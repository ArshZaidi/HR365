from dataclasses import dataclass


@dataclass
class ConfidenceResult:
    score: float
    level: str
    top_similarity: float
    mean_similarity: float
    evidence_score: float
    relevant_chunk_count: int


class ConfidenceEngine:
    """
    Heuristic confidence scorer for HR365 RAG responses.

    The score is an engineering confidence score, not
    a calibrated probability.
    """

    HIGH_THRESHOLD = 0.80
    MEDIUM_THRESHOLD = 0.60
    RELEVANCE_THRESHOLD = 0.60
    TARGET_EVIDENCE_COUNT = 2

    def calculate(
        self,
        similarity_scores: list[float],
    ) -> ConfidenceResult:

        if not similarity_scores:
            return ConfidenceResult(
                score=0.0,
                level="low",
                top_similarity=0.0,
                mean_similarity=0.0,
                evidence_score=0.0,
                relevant_chunk_count=0,
            )

        cleaned_scores = [
            max(0.0, min(1.0, float(score)))
            for score in similarity_scores
        ]

        top_similarity = max(cleaned_scores)

        mean_similarity = sum(cleaned_scores) / len(cleaned_scores)

        relevant_chunk_count = sum(
            score >= self.RELEVANCE_THRESHOLD
            for score in cleaned_scores
        )

        evidence_score = min(
            relevant_chunk_count / self.TARGET_EVIDENCE_COUNT,
            1.0,
        )

        confidence = (
            0.70 * top_similarity
            + 0.20 * mean_similarity
            + 0.10 * evidence_score
        )

        confidence = max(0.0, min(1.0, confidence))

        if confidence >= self.HIGH_THRESHOLD:
            level = "high"
        elif confidence >= self.MEDIUM_THRESHOLD:
            level = "medium"
        else:
            level = "low"

        return ConfidenceResult(
            score=round(confidence, 4),
            level=level,
            top_similarity=round(top_similarity, 4),
            mean_similarity=round(mean_similarity, 4),
            evidence_score=round(evidence_score, 4),
            relevant_chunk_count=relevant_chunk_count,
        )
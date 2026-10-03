"""
Query routing for the HR365 assistant.

The router determines which information source is required before
retrieval begins.

Routes:

    chitchat
        Greetings, thanks, goodbye, casual conversation.

    personal
        Questions that require authenticated employee data only.

    policy
        Company policy, procedure, benefits, rules, etc.

    hybrid
        Questions requiring both company policy and authenticated
        employee data.

    out_of_scope
        Clearly unrelated questions.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class QueryRoute:
    route: str
    reason: str


GREETING_PATTERNS = (
    r"^hi$",
    r"^hello$",
    r"^hey$",
    r"^hi there$",
    r"^hello there$",
    r"^hey there$",
    r"^good morning$",
    r"^good afternoon$",
    r"^good evening$",
    r"^good night$",
    r"^how are you\??$",
    r"^how's it going\??$",
    r"^how are things\??$",
    r"^thanks$",
    r"^thank you$",
    r"^thanks a lot$",
    r"^thank you so much$",
    r"^thx$",
    r"^bye$",
    r"^goodbye$",
    r"^see you$",
)


PERSONAL_MARKERS = {
    "my",
    "mine",
    "myself",
    "me",
}


PERSONAL_PHRASES = {
    "i am",
    "i'm",
    "i have",
    "i've",
    "i had",
    "i took",
    "i submitted",
    "i applied",
    "my attendance",
    "my leave",
    "my leaves",
    "my leave balance",
    "my leave request",
    "my attendance percentage",
    "my hr request",
    "my hr requests",
    "my ticket",
    "my tickets",
    "my profile",
    "my details",
    "my information",
    "my employee id",
    "my employee number",
    "my department",
    "my designation",
    "my joining date",
    "my manager",
    "how many days have i been absent",
    "how many days was i absent",
    "how many days have i been present",
    "how many days was i present",
    "show my attendance",
    "show my attendance records",
    "show my leave",
    "show my leave requests",
    "what is the status of my leave",
    "what is the status of my request",
    "what is my request status",
}

ATTENDANCE_TERMS = {
    "attendance",
    "absent",
    "absence",
    "present",
    "half day",
    "half-day",
    "check in",
    "check-in",
    "check out",
    "check-out",
    "working hours",
    "attendance percentage",
    "attendance record",
    "attendance records",
    "late mark",
    "late marks",
}


LEAVE_TERMS = {
    "leave",
    "leaves",
    "vacation",
    "casual leave",
    "sick leave",
    "earned leave",
    "annual leave",
    "leave balance",
    "leave request",
    "leave requests",
}


REQUEST_TERMS = {
    "hr request",
    "hr requests",
    "ticket",
    "tickets",
    "request status",
    "support request",
    "support requests",
    "escalation",
    "escalated",
    "grievance",
}


PROFILE_TERMS = {
    "profile",
    "employee id",
    "employee number",
    "department",
    "designation",
    "joining date",
    "manager",
    "my details",
    "my information",
}


POLICY_TERMS = {
    "policy",
    "policies",
    "rule",
    "rules",
    "allowed",
    "allow",
    "eligible",
    "eligibility",
    "procedure",
    "process",
    "guidelines",
    "requirement",
    "requirements",
    "deadline",
    "notice period",
    "benefits",
    "benefit",
    "payroll",
    "salary",
    "payslip",
    "insurance",
    "reimbursement",
    "vpn",
    "password",
    "mfa",
    "security",
    "grievance",
    "harassment",
    "safety",
    "remote work",
    "work from home",
    "code of conduct",
    "working hours",
}


OUT_OF_SCOPE_TERMS = {
    "python",
    "javascript",
    "react",
    "movie",
    "movies",
    "football",
    "cricket",
    "weather",
    "recipe",
    "gaming",
    "game",
    "music",
    "song",
    "stock market",
    "bitcoin",
    "crypto",
}


def _normalise(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _contains_term(text: str, term: str) -> bool:
    """
    Match a term without accidentally matching unrelated words.

    For example, "me" should not match "time".
    """

    escaped = re.escape(term)

    if " " in term or "-" in term:
        return term in text

    return bool(
        re.search(
            rf"\b{escaped}\b",
            text,
        )
    )


def _contains_any(
    text: str,
    terms: set[str],
) -> bool:
    return any(
        _contains_term(text, term)
        for term in terms
    )


def _is_personal(text: str) -> bool:
    # Explicit personal ownership
    if _contains_any(
        text,
        PERSONAL_MARKERS,
    ):
        return True

    if _contains_any(
        text,
        PERSONAL_PHRASES,
    ):
        return True

    # Questions phrased as requests for the user's own records.
    # These are personal even without the word "my".
    personal_record_patterns = (
        r"\bhow many days have i been absent\b",
        r"\bhow many days was i absent\b",
        r"\bhow many days was i present\b",
        r"\bhow many days have i been present\b",
        r"\bwhat is my attendance\b",
        r"\bwhat is my attendance percentage\b",
        r"\bshow my attendance\b",
        r"\bshow my attendance records\b",
        r"\bshow my leave\b",
        r"\bshow my leave requests\b",
        r"\bwhat is the status of my leave\b",
        r"\bwhat is the status of my request\b",
        r"\bwhat is my request status\b",
    )

    return any(
        re.search(
            pattern,
            text,
        )
        for pattern in personal_record_patterns
    )


def _is_greeting(text: str) -> bool:
    return any(
        re.fullmatch(
            pattern,
            text,
        )
        for pattern in GREETING_PATTERNS
    )


def classify_query(question: str) -> QueryRoute:
    """
    Classify the user's message before RAG retrieval.

    Returns one of:

        chitchat
        personal
        policy
        hybrid
        out_of_scope
    """

    text = _normalise(question)

    if not text:
        return QueryRoute(
            route="chitchat",
            reason="empty_message",
        )

    # ---------------------------------------------------------------
    # 1. Greetings / small talk
    # ---------------------------------------------------------------

    if _is_greeting(text):
        return QueryRoute(
            route="chitchat",
            reason="greeting_or_small_talk",
        )

    # ---------------------------------------------------------------
    # 2. Detect domain concepts
    # ---------------------------------------------------------------

    attendance = _contains_any(
        text,
        ATTENDANCE_TERMS,
    )

    leave = _contains_any(
        text,
        LEAVE_TERMS,
    )

    requests = _contains_any(
        text,
        REQUEST_TERMS,
    )

    profile = _contains_any(
        text,
        PROFILE_TERMS,
    )

    employee_domain = (
        attendance
        or leave
        or requests
        or profile
    )

    personal = _is_personal(text)

    policy = _contains_any(
        text,
        POLICY_TERMS,
    )

    # ---------------------------------------------------------------
    # 3. Explicitly unrelated questions
    # ---------------------------------------------------------------

    if (
        _contains_any(text, OUT_OF_SCOPE_TERMS)
        and not employee_domain
        and not policy
    ):
        return QueryRoute(
            route="out_of_scope",
            reason="unrelated_to_hr365",
        )

    # ---------------------------------------------------------------
    # 4. Personal + policy = hybrid
    # ---------------------------------------------------------------

    if personal and employee_domain and policy:
        return QueryRoute(
            route="hybrid",
            reason="employee_data_and_policy_required",
        )

    # Questions like:
    #
    # "Can I take leave next Monday?"
    #
    # may contain "I" but do not necessarily require personal
    # database information.
    #
    # However, if they explicitly mention the user's balance,
    # records, request, etc., they are hybrid.

    explicit_personal_data = (
        _contains_any(
            text,
            {
                "my balance",
                "my attendance",
                "my leave",
                "my leaves",
                "my request",
                "my requests",
                "my ticket",
                "my tickets",
                "my profile",
                "my details",
                "my information",
                "my record",
                "my records",
            },
        )
        or "i have" in text
        or "i've" in text
        or "i submitted" in text
        or "i applied" in text
    )

    if (
        explicit_personal_data
        and employee_domain
        and policy
    ):
        return QueryRoute(
            route="hybrid",
            reason="explicit_personal_data_and_policy",
        )

    # ---------------------------------------------------------------
    # 5. Personal employee question
    # ---------------------------------------------------------------

    if personal and employee_domain:
        return QueryRoute(
            route="personal",
            reason="authenticated_employee_data_required",
        )

    # ---------------------------------------------------------------
    # 6. Explicitly personal without a recognised category
    # ---------------------------------------------------------------

    if personal and policy:
        return QueryRoute(
            route="hybrid",
            reason="personal_policy_question",
        )

    # ---------------------------------------------------------------
    # 7. General HR policy
    # ---------------------------------------------------------------

    if policy or employee_domain:
        return QueryRoute(
            route="policy",
            reason="company_policy_or_hr_topic",
        )

    # ---------------------------------------------------------------
    # 8. Unknown general message
    #
    # Treat it as out-of-scope rather than sending it into RAG.
    # This prevents random messages from creating HR tickets.
    # ---------------------------------------------------------------

    return QueryRoute(
        route="out_of_scope",
        reason="no_hr_intent_detected",
    )
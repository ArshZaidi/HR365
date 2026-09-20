from app.engines.confidence_engine import ConfidenceEngine


engine = ConfidenceEngine()


test_cases = {
    "strong_policy_match": [0.92, 0.88, 0.84],
    "good_policy_match": [0.82, 0.78, 0.74],
    "moderate_match": [0.72, 0.68, 0.64],
    "weak_match": [0.58, 0.54, 0.50],
    "very_weak_match": [0.45, 0.40, 0.35],
    "no_evidence": [],
    "single_strong_chunk": [0.90],
    "single_moderate_chunk": [0.65],
}


for name, scores in test_cases.items():
    result = engine.calculate(scores)

    print(
        f"{name:25} "
        f"score={result.score:.4f} "
        f"level={result.level:6} "
        f"relevant={result.relevant_chunk_count}"
    )
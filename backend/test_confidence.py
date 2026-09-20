from app.engines.confidence_engine import ConfidenceEngine


engine = ConfidenceEngine()


tests = {
    "high": [0.92, 0.88, 0.84],
    "medium": [0.72, 0.68, 0.64],
    "low": [0.45, 0.40, 0.35],
    "empty": [],
}


for name, scores in tests.items():
    result = engine.calculate(scores)

    print(f"\n{name.upper()}")
    print("Scores:", scores)
    print("Result:", result)
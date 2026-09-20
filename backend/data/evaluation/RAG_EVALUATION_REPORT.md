# HR365 RAG Evaluation Report

## Evaluation Scope

The HR365 RAG system was evaluated using company policy documents covering
attendance, leave, remote work, payroll, benefits, IT security, conduct,
employee handbook, FAQs, grievances, and company notices.

The evaluation also included out-of-knowledge-base questions involving
employee-specific information and information not present in the knowledge base.

## Retrieval Evaluation

The retrieval evaluation measured whether the expected policy document appeared
in the top-ranked results.

- Recall@1: 93.33%
- Recall@3: 100%
- Recall@5: 100%

The results indicate that the correct policy document is generally ranked first
and consistently appears within the top three retrieved documents.

One Top-1 retrieval miss was observed for a remote security question. The
expected IT Security Policy still appeared within the Top-3 results.

## Answer Engine Evaluation

Policy questions were evaluated for:

1. Factual correctness
2. Grounding in retrieved documents
3. Source citation
4. Resistance to unsupported claims

The tested policy questions produced answers grounded in the retrieved
knowledge-base documents.

Out-of-KB questions were tested to verify that the system does not fabricate
employee-specific information.

For example, a question requesting an employee's current salary was correctly
answered with the system's knowledge-base fallback rather than an invented value.

## Confidence Engine

The confidence engine uses an engineering heuristic rather than a calibrated
probability.

The calibrated scoring formula is:

confidence =
0.70 × top_similarity +
0.20 × mean_similarity +
0.10 × evidence_score

Current thresholds:

- High: >= 0.80
- Medium: >= 0.60 and < 0.80
- Low: < 0.60

The evidence target was adjusted from three relevant chunks to two because the
current policy documents commonly produce one highly relevant primary chunk
with supporting documents ranking below the relevance threshold.

## Limitations

- Retrieval evaluation uses a relatively small manually constructed evaluation set.
- Confidence scores are engineering scores and should not be interpreted as probabilities.
- The knowledge base represents the documents available to HR365 at evaluation time.
- Employee-specific operational data is stored in PostgreSQL/Supabase rather than the RAG knowledge base.
- Further evaluation with a larger production dataset would improve confidence calibration.
# json-web-proofs
Specification work for JSON Web Proofs

The JSON Web Proofs effort aims to establish a new JSON based container, influenced by and extending the JOSE family of container formats.

While similar to JSON Web Signatures[^JWS], JSON Web Proofs aim to support newer algorithms and cryptographic techniques. These techniques establish the role of a *prover*, which has limited capabilities to derive new forms of from a signed message which can still be cryptographically verified.

Examples of capabilities an algorithm may support include:

1. Selectively disclose a subset of information to the verifier
2. Provide for multiple uses of a proof container without correlation due to cryptography
3. Disclose an answer to a predicate without disclosing the values used for evaluation
4. Proof of possession

## Specifications in Progress

### [JSON Web Proofs (JWP)](https://json-web-proofs.github.io/json-web-proofs/draft-jmiller-json-web-proof.html)
A new container, similar to JWS[^JWS], which allows for more than one payload.

### [JSON Proof Algorithms (JPA)](https://json-web-proofs.github.io/json-web-proofs/draft-jmiller-json-proof-algorithms.html)
Required and optional capabilities for algorithms within JSON Web Proofs. 

This is loosely analagous to JWA[^JWA], with concrete algorithms defined as separate specifications.

### [JSON Proof Token (JPT)](https://json-web-proofs.github.io/json-web-proofs/draft-jmiller-json-proof-token.html)
An application of JWP for representing claims about an entity, analagous to  JWT[^JWT].

[^JWS]: [JSON Web Signatures - RFC7515](JWS)
[^JWK]: [JSON Web Keys - RFC7517](JWK)
[^JWA]: [JSON Web Algorithms - RFC7518](JWA)
[^JWT]: [JSON Web Token - RFC7519](JWT)

[JWS]: https://datatracker.ietf.org/doc/html/rfc7515
[JWK]: https://datatracker.ietf.org/doc/html/rfc7517
[JWA]: https://datatracker.ietf.org/doc/html/rfc7518
[JWT]: https://datatracker.ietf.org/doc/html/rfc7519

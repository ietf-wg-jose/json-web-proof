# Name: charter-ietf-jose-03

The original [JSON Object Signing and Encryption (JOSE) working group](https://datatracker.ietf.org/doc/charter-ietf-jose/02/) standardized JSON-based representations for:
- Integrity-protected objects – JSON Web Signatures (JWS) [[RFC 7515](https://www.rfc-editor.org/rfc/rfc7515.html)]
- Encrypted objects – JSON Web Encryption (JWE) [[RFC 7516](https://www.rfc-editor.org/rfc/rfc7516.html)]
- Key representations – JSON Web Key (JWK) [[RFC 7517](https://www.rfc-editor.org/rfc/rfc7517.html)]
- Algorithm definitions – JSON Web Algorithms (JWA) [[RFC 7518](https://www.rfc-editor.org/rfc/rfc7518.html)]
- Test vectors for the above – Examples of Protecting Content Using JSON Object Signing and Encryption [[RFC 7520](https://www.rfc-editor.org/rfc/rfc7520.html)]

These were used to define the JSON Web Token (JWT) [[RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html)], which in turn, has seen widespread deployment in areas as diverse as [digital identity](https://openid.net/connect/) and [secure telephony](https://www.ietf.org/blog/stir-action/).

Concurrent to the growth of adoption of these standards to express and communicate sensitive data has been an increasing societal focus on privacy. Common privacy themes in identity solutions are user consent, minimal disclosure, and unlinkability.

A multi-decade research activity for a sizeable academic and applied cryptography community, often referred to as anonymous credentials, targets privacy and knowledge protection. Some of the cryptographic techniques developed in this space involve pairing-friendly curves and zero-knowledge proofs (ZKPs) (to name just a few).  Some of the benefits of zero-knowledge proof algorithms include unlinkability, selective disclosure, and the ability to use predicate proofs.

The current container formats defined by JOSE and JWT are not able to represent data using zero-knowledge proof algorithms. Among the reasons are that most require an additional transform or finalize step, many are designed to operate on sets and not single messages, and the interface to ZKP algorithms has more inputs than conventional signing algorithms. The reconstituted JSON Object Signing and Encryption (JOSE) working group will address these new needs, while reusing aspects of JOSE and JWT, where applicable.

This group is chartered to work on the following deliverables:

- An Informational document detailing Use Cases and Requirements for new specifications enabling JSON-based selective disclosure and zero-knowledge proofs.

- Standards Track document(s) specifying representation(s) of independently-disclosable integrity-protected sets of data and/or proofs using JSON-based data structures, which also aims to prevent the ability to correlate by different verifiers.

- Standards Track document(s) specifying representation(s) of JSON-based claims and/or proofs enabling selective disclosure of these claims and/or proofs, and that also aims to prevent the ability to correlate by different verifiers.

- Standards Track document(s) specifying how to use existing cryptographic algorithms and defining their algorithm identifiers.  The working group will not invent new cryptographic algorithms.

- Standards Track document(s) specifying how to represent keys for these new algorithms as JSON Web Keys (JWKs).

- An Informational document defining test vectors for these new specifications.

- Standards Track document(s) defining CBOR-based representations corresponding to all the above, building upon the COSE and CWT specifications in the same way that the above build on JOSE and JWT.

One or more of these goals may be combined into a single document, in which case the concrete milestones for these goals will be satisfied by the consolidated document(s). 

An informal goal of the working group is close coordination with the [rechartered W3C Verifiable Credentials WG](https://www.w3.org/2022/05/proposed-vc-wg-charter.html), which has taken a dependency on this work for the second version of its Verifiable Credentials specification.  The working group will also coordinate with the [Selective Disclosure JWT](https://datatracker.ietf.org/doc/draft-ietf-oauth-selective-disclosure-jwt/) work in the OAuth working group, the [Privacy Pass](https://datatracker.ietf.org/doc/charter-ietf-privacypass/) working group, and the CFRG.

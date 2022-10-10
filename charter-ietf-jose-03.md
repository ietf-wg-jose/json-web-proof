# Proposed charter for JSON Web Proofs working group - actual working group name TBD

The [JSON Object Signing and Encryption (JOSE) working group](https://datatracker.ietf.org/doc/charter-ietf-jose/02/) standardized JSON-based representations for:
- Integrity-protected objects – JSON Web Signatures (JWS) [[RFC 7515](https://www.rfc-editor.org/rfc/rfc7515.html)]
- Encrypted objects – JSON Web Encryption (JWE) [[RFC 7516](https://www.rfc-editor.org/rfc/rfc7516.html)]
- Key representations – JSON Web Key (JWK) [[RFC 7517](https://www.rfc-editor.org/rfc/rfc7517.html)]
- Algorithm definitions – JSON Web Algorithms (JWA) [[RFC 7518](https://www.rfc-editor.org/rfc/rfc7518.html)]
- Test vectors for the above – Examples of Protecting Content Using JSON Object Signing and Encryption [[RFC 7520](https://www.rfc-editor.org/rfc/rfc7520.html)]

These were used to define the JSON Web Token (JWT) [[RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html)], which in turn, has seen widespread deployment in areas as diverse as [digital identity](https://openid.net/connect/) and [secure telephony](https://www.ietf.org/blog/stir-action/).

Concurrent to the growth of adoption of these standards to express and communicate sensitive data has been an increasing societal focus on privacy. Common privacy themes in identity solutions that intersect with JWT are user consent, minimal disclosure, and unlinkability.

In recent years, newer solutions have been evolving, such as [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/), that assume multiple use of the JWTs and formalize the entities of Issuer, Holder, and Verifier. A Verifiable Credential lifecycle has three accompanying phases: issuance, storage, and presentation. The JOSE and JWT standards have also been adopted by Verifiable Credentials (for the JWT-VC representation), but JWS and JWT have limitations that make privacy protection challenging.

The first limitation is handling selective disclosure (or [data minimization](https://www.rfc-editor.org/rfc/rfc6973.html#section-6.1)), where the Holder is able to limit how much information is being shared with a Verifier – in particular, which JWT claims are disclosed. Using JWTs for selective disclosure requires asking the Issuer to create a JWT containing only the selected claims in real time, based on the user consent, which limits the transaction to being online with an available issuer, and informs the issuer of the subject’s choices.

The second limitation is unlinkability. While it is a common experience to share unique trackable identifiers, such as e-mail addresses, names, and locations, there are also many identity-related exchanges that only involve an access control decision or capability without needing to uniquely identify a person. The only solution today using a JWT is to request a new token per Verifier from the issuer each time, or ahead of time in batches to be able to use a different one per Verifier – such that they are single-use tokens.

Accomplishing both goals efficiently and securely has been a multi-decade research activity for a sizeable academic and applied cryptography community, often referred to as anonymous credentials. Some of the cryptographic techniques developed in this space involve pairing-friendly curves and zero-knowledge proofs (to name just a few). The current JOSE and JWT specifications are not sufficiently general to enable use of these newer techniques.  This charter is for a working group (name TBD) that will build on what came before but also rectify these shortcomings.

This group is chartered to work on the following deliverables:

- An Informational document detailing Use Cases and Requirements for new specifications enabling JSON-based selective disclosure and zero-knowledge proofs.

- Standards Track document(s) specifying representation(s) of independently-disclosable integrity-protected sets of data and/or proofs using JSON-based data structures, which also aims to prevent the ability to correlate by different verifiers.

- Standards Track document(s) specifying representation(s) of JSON-based claims and/or proofs enabling selective disclosure of these claims and/or proofs, and that also aims to prevent the ability to correlate by different verifiers.

- Standards Track document(s) specifying new algorithms and algorithm identifiers.

- Standards Track document(s) specifying how to represent keys for these new algorithms as JSON Web Keys (JWKs).

- An Informational document defining test vectors for these new specifications.

- Standards Track document(s) defining CBOR-based representations corresponding to all the above, building upon the COSE and CWT specifications in the same way that the above build on JOSE and JWT.

One or more of these goals may be combined into a single document, in which case the concrete milestones for these goals will be satisfied by the consolidated document(s). 

An informal goal of the working group is close coordination with the [rechartered W3C Verifiable Credentials WG](https://www.w3.org/2022/05/proposed-vc-wg-charter.html), which has taken a dependency on this work for the second version of its Verifiable Credentials specification.  The working group will also coordinate with the [Selective Disclosure JWT](https://datatracker.ietf.org/doc/draft-ietf-oauth-selective-disclosure-jwt/) work in the OAuth working group.

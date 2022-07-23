# Name: JSON Web Proofs / JSON Object Signing and Encryption (JOSE)

## Description

The JOSE RFCs and JWT, have been widely adopted for identity use cases, including for the widely-deployed [OpenID Connect](https://openid.net/connect/) protocol and [STIR](https://www.ietf.org/blog/stir-action/).  Concurrent to the growth of adoption of these standards has been an increasing societal focus on privacy.  Common privacy themes in identity solutions that intersect with JWT are user consent and minimal disclosure.

In recent years, newer solutions have been evolving such as [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) that formalize the entities of Issuer, Holder, and Verifier.  A Verifiable Credential lifecycle has three accompanying phases: issuance, storage, and presentation.  The JOSE and JWT standards have also been adopted by Verifiable Credentials (for the JWT-VC representation), but JWS and JWT have limitations that make privacy protection challenging.

The first limitation is handling selective disclosure (or [data minimization](https://www.rfc-editor.org/rfc/rfc6973.html#section-6.1)), where the Holder is able to limit how much information is being shared with a Verifier – in particular, which JWT claims are disclosed. Using JWTs for selective disclosure requires asking the Issuer to create a JWT containing only the selected claims in real time, based on the user consent, which limits the transaction to being online with an available issuer, and informs the issuer of the subject’s choices.

The second limitation is unlinkability. While it is a common experience to share unique trackable identifiers, such as e-mail addresses, names, and locations, there are also many identity-related exchanges that only involve an access control decision or capability without needing to uniquely identify a person. The only solution today using a JWT is to request a new token per Verifier from the issuer each time, or ahead of time in batches to be able to use a different one per Verifier – such that they are single-use tokens.

Accomplishing both goals efficiently and securely has been a multi-decade research activity for a sizeable academic and applied cryptography community, often referred to as anonymous credentials. Some of the cryptographic techniques developed in this space involve pairing-friendly curves and zero-knowledge proofs (to name just a few).  Simple selective disclosure techniques using well-established cryptographic algorithms, such as the salted hashes used by the ISO Mobile Driver License (mDL) spec, are also in scope.  The current JOSE and JWT specifications are not sufficiently general to enable use of these newer techniques.

This BoF proposes to re-form the JSON Object Signing and Encryption (JOSE) working group.  The reconstituted JOSE working group will build on what came before but also rectify these shortcomings.  Specifically, it will develop a set of companion specifications to the existing JOSE specs that are designed to support the privacy-enhancing primitives of selective disclosure and unlinkability.  These specifications will utilize defined cryptographic schemes, standardizing their use in a JSON-based serializable container format; creation or standardization of new cryptographic algorithms would not be in scope.  Parallel CBOR-based representations may also be developed.

## Required Details
- Status: WG Forming
- Responsible AD: Roman Danyliw
- BOF proponents: Jeremie Miller <jeremie.miller@gmail.com>, Michael B. Jones <michael.jones@microsoft.com>
- BOF chairs: (Leif Johansson has volunteered)
- Number of people expected to attend: 40
- Length of session (1 or 2 hours): 1 hour
- Conflicts (whole Areas and/or WGs)
   - Chair Conflicts: TBD
   - Technology Overlap: OAuth and COSE Working Groups
   - Key Participant Conflict: Michael B. Jones, Ivaylo Petrov

## Information for IAB/IESG

WIP:

- Relationships with related ongoing standards work:
  - The JSON Web Proofs specs were incubated in the [Applied Cryptography working group of the Decentralized Identity Foundation (DIF)](https://json-web-proofs.github.io/json-web-proofs/draft-jmiller-jose-json-web-proof.html), with the explicit goal of taking them to the IETF for standardization once sufficiently mature.  The work is now mature enough to bring to the IETF.
    - DIF is bringing this to the IETF because of the IETF's deep expertise in security and cryptography and its closely-related JOSE/JWT and COSE/CWT work.
  - A dependency upon this work was written into the [revised W3C Verifiable Credentials working group charter](https://www.w3.org/2022/05/proposed-vc-wg-charter.html).  The W3C wants to see the IETF standardize this.
- Any protocols or practices that already exist in this space:
  - IETF JOSE/JWT and COSE/CWT
  - W3C Verifiable Credentials (using the JWT-VC representation)
  - ISO Mobile Driver License (mDL)
  - BBS Signatures
  - AnonCreds
- Which (if any) modifications to existing protocols or practices are required:
  - Extend JOSE/JWT and COSE/CWT to support selective disclosure and zero-knowledge proofs
- Which (if any) entirely new protocols or practices are required:
  - New cryptographic container formats related to JOSE and COSE
- Implementations:
  - There is an implementation by Ping Identity.  Microsoft plans to implement.  Transmute plans to implement.  Others in the Verifiable Credentials space also plan to implement.  Many of these people will be at IETF in Philadelphia, some specifically for this BoF.  We expect some of these implementations to be open source.


## Agenda
   - https://github.com/json-web-proofs/json-web-proofs/blob/main/bof-agenda.md

## Links to the mailing list, draft charter if any, relevant Internet-Drafts, etc.
   - Draft charter: https://github.com/json-web-proofs/json-web-proofs/blob/main/charter-ietf-jose-03.md
   - GitHub: https://github.com/json-web-proofs/json-web-proofs
   - Relevant drafts:
      - JSON Web Proof:
         - https://json-web-proofs.github.io/json-web-proofs/draft-jmiller-jose-json-web-proof.html
      - JSON Proof Algorithms:
         - https://json-web-proofs.github.io/json-web-proofs/draft-jmiller-jose-json-proof-algorithms.html
      - JSON Proof Token:
         - https://json-web-proofs.github.io/json-web-proofs/draft-jmiller-jose-json-proof-token.html

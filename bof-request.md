# Name: JSON Web Proofs

## Description

The JOSE RFCs and in particular JWT have been widely adopted for identity use-cases, the most predominant of which is in OpenID Connect.  Concurrently to the growth of adoption of these standards has been the increasing societal focus on privacy technologies and solutions.  Common privacy themes in identity solutions that intersect with the usage of JWT are consent and minimal disclosure.  For example, OAuth provides a mechanism to obtain consent from the subject before issuing an access token using Connect, and the best practices for that token are to minimize its scope and claims to only those needed for the given client.

In recent years newer solutions have been evolving such as [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) that formalize the entities of Issuer, Holder, and Verifier.  A Verifiable Credential lifecycle has three accompanying phases: issuance, storage, and presentation.  The JOSE and JWT standards have also been adopted (VC-JWT) and are being deployed for solutions architected around this new approach, but they have limitations that make privacy protection challenging.

The first limitation is handling selective disclosure (or [data minimization](https://www.rfc-editor.org/rfc/rfc6973.html#section-6.1)), where the Holder is able to limit how much information is being shared to a Verifier.  Using a VC-JWT requires asking the Issuer to perform the chosen selection, which limits the transaction to being online with an available Issuer, and also informs the issuer of the subject's choices.  To work around this there have been numerous ideas such as using a Merkle Tree or other hash-based constructs that move the claims outside of the JWT and only encapsulate some form of hashes that can be used to verify them.  These approaches are not well developed and present new requirements to supporting communication protocols which must now convey the claims separately from the security object.

The second limitation is unlinkability.  With the widespread prevalence of user tracking on the web, it is important to reduce or eliminate all implicit tracking capability in all identity exchanges.  This may seem counter-intuitive given the purpose of most digital identity technology is to identify someone.  While it is indeed a common experience to share unique trackable identifiers such as email addresses, names, and locations, there are a far larger number of identity-related exchanges that only involve an access control decision or capability token without needing to uniquely identify a person.  The only solution today using a JWT is to request a new one from the Issuer each time or ahead of time in batches, a single use token.

Accomplishing both of these capabilities efficiently and securely has been a multi-decade research activity for a sizeable academic and applied cryptography community, often referred to anonymous credentials from an [early paper](http://cs.brown.edu/people/alysyans/papers/cl01a.pdf) on the subject.  Some of the cryptographic techniques developed in this space involve pairing-based curves, zero-knowledge proofs, accumulators, and mercurial signatures (to name just a few).  The requirements to adopt any of these solutions live entirely outside of the current scope of the JOSE specifications.

This BOF aims to foster a discussion around establishing a new Working Group to develop a set of companion specifications to JOSE that are designed to support the privacy primitives of selective disclosure and unlinkability.  These specifications would only formalize how to incorporate externally defined proof-based cryptographic schemes into a compatible and serializable container format, creation or standardization of those schemes is not in scope.

## Required Details
- Status: WG Forming
- Responsible AD: TBD
- BOF proponents: Jeremie Miller <jeremie.miller@gmail.com>, Mike Jones <michael.jones@microsoft.com>
- BOF chairs: TBD
- Number of people expected to attend: 25
- Length of session (1 or 2 hours): 1 hours
- Conflicts (whole Areas and/or WGs)
   - Chair Conflicts: TBD
   - Technology Overlap: TBD
   - Key Participant Conflict: TBD

## Information for IAB/IESG

WIP:

- Any protocols or practices that already exist in this space:
  - JOSE/COSE
  - VC-JWT
  - BBS
  - Anoncreds
- Which (if any) modifications to existing protocols or practices are required:
  - Extend COSE to support a proofs
- Which (if any) entirely new protocols or practices are required:
  - New container formats based on JOSE and COSE
- Open source projects (if any) implementing this work:
  - TBD


## Agenda
   - https://github.com/json-web-proofs/json-web-proofs/bof-agenda.md

## Links to the mailing list, draft charter if any, relevant Internet-Drafts, etc.
   - Github: https://github.com/json-web-proofs/json-web-proofs
   - Draft charter: TBD
   - Relevant drafts:
      - JSON Web Proofs:
         - https://json-web-proofs.github.io/json-web-proofs/draft-jmiller-json-web-proof.html
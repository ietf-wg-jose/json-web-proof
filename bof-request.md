# Name: JSON Web Proofs
## Description 
There are many new use-cases arising around the subject matter of [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/), with a particular focus on [Self-sovereign identity](https://en.wikipedia.org/wiki/Self-sovereign_identity).  Common to all of the systems being developed and deployed are the core entities of the Issuer, Holder, and Verifier as defined by the W3C VC Data Model.  The credential lifecycle has three accompanying phases: issuance, storage, and presentation.  A key principle is that the storage is always in an application under the subject's direct control and not stored remotely by a third party.

There are two essential privacy capabilities that accompany this architecture: selective disclosure and unlinkability.  Selective disclosure addresses enabling the subject to consent to a limited release of claims to a verifier, a form of [data minimization](https://www.rfc-editor.org/rfc/rfc6973.html#section-6.1).  Unlinkability addresses the subject's desire to minimize automated tracking and correlation of their activities across multiple interactions with different parties.

Accomplishing both of these capabilities has been a multi-decade research activity for a sizeable academic and applied cryptography community, often referred to anonymous credentials from an [early paper](http://cs.brown.edu/people/alysyans/papers/cl01a.pdf) on the subject.  Some of the cryptographic techniques developed in this space involve pairing-based curves, zero-knowledge proofs, accumulators, and mercurial signatures (to name just a few).

WIP points to add yet:
- Creating a new set of parallel specs to JOSE: JWP, JPA, JPT (not JWK, it still works)
- Working with COSE WG for a compatible CBOR-based definition
- Not defining cryptographic primitives, proofs, or signature schemes, but are defining applications of them (same scope as JWA)

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
  - JOSE
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
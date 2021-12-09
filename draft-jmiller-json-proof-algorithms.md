%%%
title = "JSON Proof Algorithms"
abbrev = "jpa"
docName = "draft-jmiller-json-proof-algorithms-latest"
category = "info"
ipr = "none"
workgroup="todo"
keyword = ["jose", "zkp", "jwp", "jws", "jpa"]

[seriesInfo]
name = "Internet-Draft"
value = "draft-jmiller-json-proof-algorithms"
status = "standard"

[pi]
toc = "yes"

[[author]]
initials = "J."
surname = "Miller"
fullname = "Jeremie Miller"
organization = "Ping Identity"
  [author.address]
   email = "jmiller@pingidentity.com"

[[author]]
initials = "M."
surname = "Jones"
fullname = "Michael B. Jones"
organization = "Microsoft"
  [author.address]
  email = "mbj@microsoft.com"
  uri = "https://self-issued.info/"

%%%

.# Abstract

The JSON Proof Algorithms (JPA) specification registers cryptographic algorithms and identifiers to be used with the JSON Web Proof (JWP) and JSON Web Key (JWK) specifications. It defines several IANA registries for these identifiers.

{mainmatter}

# Introduction

The JSON Web Proof (JWP) draft establishes a new secure container format that supports selective disclosure and unlinkability using Zero-Knowledge Proofs (ZKPs) or other cryptographic algorithms.

# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 [@!RFC2119] [@RFC8174]
when, and only when, they appear in all capitals, as shown here.

# Background

JWP defines a container binding together a protected header, one or more payloads, and a cryptographic proof.  It does not define any details about the interactions between an application and the cryptographic libraries that implement proof-supporting algorithms.

Due to the nature of ZKPs, this specification also documents the subtle but important differences in proof algorithms versus those defined by the JSON Web Algorithms RFC.  These differences help support more advanced capabilities such as blinded signatures and predicate proofs.

# Algorithm Basics

The four principal interactions that every proof algorithm MUST support are `[sign](#sign)`, `[verify_signature](#verify-signature)`, `[prove](#prove)`, and `[verify_proof](#verify-proof)`.

Some algorithms MAY also support two additional interactions of `[request_signature](#request-signature)` and `[request_proof](#request-proof)`.  While these do not use a JWP container as input or output, they are included here in order to maximize interoperability across proof algorithm implementations.

## Sign

The JWP is first created as the output of a proof algorithm's `sign` operation.

TODO:

* MUST support the protected header as an octet string
* MUST support one or more payloads, each as an octet string
* MAY support the output of the `request_signature` operation from the requesting party
* MAY support signing hidden payloads with no octet string
* MUST include integrity protection for the header and all payloads, specify all digest and hash2curve methods

## Verify Signature

Performed by the requesting party to verify the signed JWP.

TODO:

* MAY support local state from the `request_signature` operation
* MAY return a modified JWP for serialized storage without the local state
* MAY support verifying any hidden payloads

## Prove

Used to apply any selective disclosure choices and perform any unlinkability transformations.

TODO:

* MAY support the output of the `request_proof` operation from the requesting party
* MUST support ability to hide any payload
* MUST always include the protected header
* MAY add/append new payloads
* MAY replace the proof value
* MUST indicate if the input JWP is able to be used again
* MAY support an input JWP that resulted from a previous `prove` operation

## Verify Proof

Performed by the requesting party on a JWP to verify any revealed payloads and/or assertions about them from the proving party, while also verifying they are the same payloads and ordering as witnessed by the signing party.

TODO:

* MUST verify the integrity of all revealed payloads
* MUST verify any included assertions about a hidden payload as true
* MAY support local state from the `request_proof` operation
* App interface to interact with the resulting verified assertions is out of scope (may also be part of the request proof state)
* SHOULD indicate if the JWP can be re-used to generate a new proof

## Request Signature

TODO

## Request Proof

TODO

# Algorithm Specifications

This section defines how to use specific algorithms for JWPs.

## Single Use

This is a very simple use of traditional keypair-based signatures that supports selective disclosure.  Unlinkability is only achieved by requiring that each JWP is single-use only.  When the prover has an active relationship with the signer where new single-use JWPs can be created dynamically or in batches, this approach is very efficient and immediately usable with existing traditional crypto libraries.

The signer generates an ephemeral keypair and uses that to sign each individual payload, simply appending each of those to compose the initial input to the signature.  The ephemeral public key used is included in the protected header and integrity protected. The aggregated and ordered list of individual payload signatures is then signed with the signer's public key and appended to create the initial proof value.

The prover can then choose which payloads to disclose and leave the proof value intact when presenting the JWP to a verifier.  The verifier will only need to verify the included ephemeral signatures for the disclosed payloads along with the final signature using the signer's public key.

Proposed JWK `alg` value is "SU" with a `crv` value being whichever keypair type is being used, for example "P-256".

Proposed JWP `alg` value is of the format "SU-" appended with the relevant JWS `alg` value for the chosen keypair algorigthm, for example "SU-ES256"

TODO, turn pseudocode into a fully unrolled step-by-step example:
```
EK = ephemeral key
IK = issuer key 
sigs = join(EK.sign(JWK(EK)), EK.sign(payload[0]), EK.sign(payload[1]), EK.sign(payload[2]), ...)
su_sig = join(sigs, IK.sign(sigs))
```


## BBS+

Applying the BBS+ signature algorithm to a JWP is extremely straight forward.  The BBS+ sign methods take an ordered array of octet messages and return a signature value.  Each JWP payload is one message, and the resulting signature is used as the initial proof value.

When proving, the BBS+ create proof method takes the original signature, array of messages, a nonce, and the indicies of which messages are being disclosed.  The output is the new proof value.  The nonce value should be generated or provided by the verifier and its handling is out of scope of JWP and this algorithm.

Proposed JWK `alg` value is "BBS" with a `crv` value of "Bls12381G2".

Proposed JWP `alg` value is "BBS-Bls12381G2".

## ZKSnark

TBD

# Security Considerations

* Data minimization of the proof value
* Unlinkability

# IANA Considerations

## JWP Algorithms Registry

This section establishes the IANA JWP Algorithms Registry.  It also registers the following algorithms.

TBD

{backmatter}

# Acknowledgements

TBD

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

Some JPAs MAY also support two additional interactions of `[request_signature](#request-signature)` and `[request_proof](#request-proof)`.  While these do not use a JWP container as input or output, they are included here in order to maximize interoperability across JPA implementations.

## Sign

The JWP is first created as the output of a JPA's `sign` operation.

TODO:

* MUST support the protected header as an octet string
* MUST support one or more payloads, each as an octet string
* MAY support the output of the `request_signature` operation from the requesting party (for blinded payloads)
* MUST include integrity protection for the header and all payloads
* MUST specify all digest and hash2curve methods used

## Verify Signature

Performed by the requesting party to verify the signed JWP.

TODO:

* MAY support local/cached private state from the `request_signature` operation (the blinded payloads)
* MAY return a modified JWP for serialized storage without the local state (with the payloads unblinded)
* MUST fully verify the proof value against the protected header and all payloads
* MUST fail if given a proven JWP

## Prove

Used to apply any selective disclosure choices and perform any unlinkability transformations.

TODO:

* MAY support the output of the `request_proof` operation from the requesting party (for predicate proofs and verifiable computation requests)
* MUST support ability to hide any payload
* MUST always include the protected header
* MAY replace the proof value
* MUST indicate if the input JWP is able to be used again
* MAY support an input JWP that resulted from a previous `prove` operation

## Verify Proof

Performed by the requesting party on a JWP to verify any revealed payloads and/or assertions about them from the proving party, while also verifying they are the same payloads and ordering as witnessed by the signing party.

TODO:

* MUST verify the integrity of all revealed payloads
* MUST verify any included assertions about a hidden payload as true
* MAY support local state from the `request_proof` operation
* Out of scope is app interface to interact with the resulting verified assertions (may also be part of the request proof state)
* MAY indicate if the JWP can be re-used to generate a new proof
* MUST fail if given only a signed JWP

## Request Signature

TODO

## Request Proof

TODO

# Algorithm Specifications

This section defines how to use specific algorithms for JWPs.

## Single Use

The Single Use (SU) algorithm is based on composing multiple traditional JWS values into a single JWP proof value.  It enables a very simple form of selective disclosure without requiring any advanced cryptographic techniques.  It does not support unlinkability if the same JWP is presented multiple times, therefore when privacy is required the prover must be able to interact with the signer again to receive new single-use JWPs (dynamically or in batches).

### Signer Setup

To create a Single Use JWP the Signer must first generate a unique ephemeral key-pair using a JWS algorithm.  This key-pair will be used to sign the parts of a single JWP and then discarded.  The selected algorithm must be the same for both the ephemeral key and the Signer's public key.

The signer must choose only an asymmetric JWS algorithm so that each signature is non-deterministic.  This ensures that no other party can brute-force any non-disclosed payloads based only on their individual signatures.

The JWK of the ephemeral key must be included in the JWP protected header with the property name of `proof_jwk` and contain only the public values.

### Preparation

To prepare the JWP for signing or verification a Parts List is created.  Each payload octet string is placed into the Parts List preserving their order from the JWP.  The JWP Protected Header octet string is then appended to this list as the last element

The Parts List will always be an ordered array with a length of the total number of payloads plus one (for the protected header).  Each item in the list is an individual unencoded (binary) octet string of variable length.

### Using JWS

The ephemeral key-pair is then used to generate an individual JWS for each item in the Parts List.

Each JWS is created with it's own protected header containing only the minimum required `alg` value.  Since the JWS protected header itself is not included in the resulting JWP, it must be a static value in the form of `{"alg":"***"}` where `***` is the JWS asymmetric key algorithm being used.  This value is re-created by a Verifier based on the `proof_jwk` included in the JWP protected header.

The octet string of each Parts List item is used as the JWS body, creating a unique JWS for each item.

### Proof Value

Each JWS signature octet string (the fixed-length binary value, *not* the Base64 URL encoded form) is appended together in the same order as they were generated from the Parts List.

The resulting combined single octet string will be the fixed length of each signature (for example, 32 octets for the ES256 algorithm), multiplied by the number of items in the Parts List (example total would be `32 * (5 payloads + 1 protected header) = 192 octets`).

The appended total of the ephemeral signature parts is itself then signed using a JWS with the Signer's key-pair for their public key using the same fixed protected header containing only the required `alg` value.  Any protected header values from the Signer are always placed into the JWP's protected header and not the JWS used to generate/sign the Proof value.

### Selective Disclosure

The Prover does not modify the JWP Proof value when presenting it to a Verifier, it will always contain the full set of JWS signature parts for each payload and the protected header.  Since this value is fixed for the JWP and always revealed, they should only be used and presented a single time to each Verifier in order for the Prover to remain unlinkable across multiple interactions.

Each payload can be selectively disclosed by simply including it in the presented JWP, leaving any hidden ones blank as a sparse array per the JWP encoding rules.  The Verifier uses the disclosed payloads and generates a fixed JWS protected header in order to perform validation of just those payloads using the matching JWS signature part from the Proof value and the JWK included in the JWP protected header.

### Verification

With each disclosed payload verified as described above, the Verifier also always verifies the JWP protected header against the matching JWS signature part in the Proof value.

Finally, the Proof value itself must be verified against the Signer's public key.  First, the correct signature length octets of the given public key are removed from the end of the Proof value, and the remaining octet string is used as the body of the final verification JWS against the public signature octets that were just removed.

### JPA Registration

Proposed JWP `alg` value is of the format "SU-" appended with the relevant JWS `alg` value for the chosen public and ephemeral key-pair algorithm, for example "SU-ES256".

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

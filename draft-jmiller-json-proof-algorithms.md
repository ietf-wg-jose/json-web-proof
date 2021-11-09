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

%%%

.# Abstract

The JSON Proof Algorithms (JPA) specification registers cryptographic algorithms and identifiers to be used with the JSON Web Proof (JWP) and JSON Web Key (JWK) specifications. It defines several IANA registries for these identifiers.

{mainmatter}

# Introduction

The JSON Web Proof (JWP) draft establishes a new secure container format that supports selective disclosure and unlinkability using Zero-Knowledge Proofs (ZKPs) or other newer cryptographic algorithms.

# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 [@!RFC2119] [@RFC8174]
when, and only when, they appear in all capitals, as shown here.

# Background

JWP defines a clean abstraction around the parts of a container binding together a protected header and one or more payloads.  It does not define any details about the interactions between an application and the cryptographic libraries that implement proof-supporting algorithms.

Due to the nature of ZKPs, this specification also documents the subtle but important differences in proof algorithms versus those defined by the JSON Web Algorithms RFC.  These changes help support more advanced capabilities such as blinded signatures and predicate proofs.

# Algorithm Basics

The four principle interactions that every proof algorithm MUST support are `[sign](#sign)`, `[verify_signature](#verify-signature)`, `[prove](#prove)`, and `[verify_proof](#verify-proof)`.

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

Performed by the requesting party to verify the newly signed JWP.

TODO:

* MAY support local state from the `request_signature` operation
* MAY return a modified JWP for serialized storage without the local state
* MAY support verifying any hidden payloads

## Prove

Used to apply any selective disclosure preferences and perform any unlinkability transformations.

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
* Out of scope is app interface to interact with the resulting verified assertions (may also be part of the request proof state)
* MAY indicate if the JWP can be re-used to generate a new proof

## Request Signature

TODO

## Request Proof

TODO

# Security Considerations

* Data minimization of the proof value
* Unlinkability

# IANA Considerations

This document has no IANA actions.

{backmatter}

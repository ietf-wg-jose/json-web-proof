%%%
title = "JSON Web Proof"
abbrev = "jwp"
docName = "draft-jmiller-json-web-proof-latest"
category = "info"
ipr = "none"
workgroup="todo"
keyword = ["jose", "zkp", "jwp", "jws"]

[seriesInfo]
name = "Internet-Draft"
value = "draft-jmiller-json-web-proof"
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
initials = "D."
surname = "Waite"
fullname = "David Waite"
organization = "Ping Identity"
  [author.address]
  email = "dwaite+jwp@pingidentity.com"

%%%

.# Abstract

The JOSE set of standards established JSON-based container formats for [Keys](https://datatracker.ietf.org/doc/rfc7517/), [Signatures](https://datatracker.ietf.org/doc/rfc7515/), and [Encryption](https://datatracker.ietf.org/doc/rfc7516/).  They also established [IANA registries](https://www.iana.org/assignments/jose/jose.xhtml) to enable the algorithms and representations used for them to be extended.  Since those were created, newer cryptographic algorithms that support selective disclosure and unlinkability have matured and started seeing early market adoption.

This document adds to the JOSE family by standardizing a new container format very similar in purpose and design to a JWS, called a _JSON Web Proof (JWP)_.  It adds support for the new algorithms by way of containing multiple individual payloads instead of a singular one as well as an additional proof-generation step to apply the privacy preserving selection and computation.

{mainmatter}

# Introduction

The JOSE specifications are very widely deployed and well supported technology combining security with the accessibility of JSON.  JWTs [@!RFC7519] are one of the most common encapsulation formats for identity and access claims, which are used with the OpenID Connect standards.  More recently, JOSE and JWTs are being integrated as part of the W3C's Verifiable Credentials work to implement Decentralized Identity use-cases.

With these new use cases, there is an increased focus on adopting privacy-protecting cryptographic primitives.  While such primitives are still an active area of academic and applied research, the leading candidates introduce new patterns that are not currently supported by JOSE.  These new patterns are largely focused on two areas: supporting selective disclosure when presenting a credential and minimizing correlation through the use of Zero-Knowledge Proofs (ZKPs), instead of traditional signatures.

There are a growing number of these cryptographic primitives which support selective disclosure while protecting privacy across multiple presentations.  Examples that have already been or are being deployed in the context of Verifiable Credentials are:

* [CL Signatures](https://eprint.iacr.org/2012/562.pdf)
* [IDEMIX](http://www.zurich.ibm.com/idemix)
* [BBS+](https://github.com/mattrglobal/bbs-signatures)
* [MerkleDisclosureProof2021](https://github.com/transmute-industries/merkle-disclosure-proof-2021)
* [Mercural Signatures](https://eprint.iacr.org/2020/979)
* [PS Signatures](https://eprint.iacr.org/2015/525.pdf)
* [U-Prove](https://www.microsoft.com/en-us/research/project/u-prove/)
* [Spartan](https://github.com/microsoft/Spartan)

All of these follow the same pattern of taking multiple claims (a.k.a., "attributes" or "messages" in the literature) and binding them together into an issued credential.  These are then later securely one-way transformed into a presentation, revealing potentially only a subset of the original claims as required or just proofs of the values.


# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 [@!RFC2119] [@RFC8174]
when, and only when, they appear in all capitals, as shown here.

# Background

A _JSON Web Proof (JWP)_ is very similar to a JWS [@RFC7515], with the addition that it can contain multiple individual payloads instead of a singular one.  New JWP-supporting algorithms are then able to separate and act on the individual payloads contained within.

In addition to the JWS `sign` and `verify` interactions, JWP also importantly adds a `prove` processing step for interaction with the algorithm to perform the selective disclosure and privacy preserving transformations.  This allows for multi-party interactions where a credential is issued from one party, derived by the prooving party, then presented to another verifying party.  While `sign` only occurs once to create a JWP, the `prove` and `verify` steps may be safely repeated when supported by the algorithm.

The intent of JSON Web Proofs is to establish a common container format for multiple payloads that can be integrity-verified against a proof value.  It does not create or specify any cryptographic protocols,  interaction protocols, or custom options for algorithms with additional capabilities.

Algorithm definitions that support JWPs will be done in separate companion specifications - just as the [JSON Web Algorithms] [@RFC7518] specification does for JWS and JWE [@RFC7516].

# JWP Format

A JWP always contains a protected header along with one or more specific payloads.  The payloads are always serialized and processed as an ordered array.

An individual payload may contain structured information such as a JSON document or be a simple value such as a number, string, or even a binary image.  Some algorithms may support payload values that are cryptographic values such as elliptic curve points or blinded secrets.

## Protected Header

Although there are multiple payloads, the protected header still represents the JWP as a whole.

It is recommended that payload-specific information is not included in the header and is handled outside of the cryptographic envelope.  This is to minimize any correlatable signals in the metadata, to prevent a verifier from categorizing based on header changes that may varry between multiple JWPs.

The JWP protected header MUST have at minimum an `alg` that supports proofs with signing, prooving, and verifying processing steps.

For example:
```json
{
    "alg":"BBS-BLS12"
}
```

Every JWP algorithm must include a digest method that is used to generate a hash of the base64url serialized protected header.  The protected header cannot be selectively disclosed and the digest value MUST be included in all proof values.

## Payloads

Payloads are always represented as an ordered array.  The mapping of which value is in which payload slot is out of scope of this specification.

In order to support ZKPs, individual payloads cannot be serialized before they are passed into an algorithm implementation.  This enables the algorithms to accept and internally encode elliptic curve points, blinded values, plain numbers, membership keys, etc.  Implementations are therefore required to provide optional arguments for each payload such that the application can utilize these capabilities as needed.

When selective disclosure preferences are applied, any one or more payloads may be hidden.  The position of other payloads does not change due to any preceeding ones being hidden - the resulting array will simply be sparse without the hidden payloads.

## Proof

The proof value is a binary octet string that is opaque to applications.  Individual proof-supporting algorithms are responsible for the contents and security of the proof value along with any required internal structures to it.

Implementations will also be required to provide optional arguments for each payload as input into the `prove` step.  These arguments can be used for generating predicate proofs, linking options, etc.

Algorithms SHOULD generate a new un-correlatable proof value during the `prove` step.  A JWP may also be single-use, where correlation across multiple derivations is not a factor.

# Serializations

Each disclosed payload MUST be base64url encoded when preparing it to be serialized.  The header and proof are also individually base64url encoded.

Like JWS, JWP supports both a Compact Serialization and a JSON Serialization.

## Compact Serialization

The individually encoded payloads are concatenated with the `~` character to form an ordered delimited array. Any hidden payloads during a derivation are simply left blank, resulting in sequential `~~` characters such that all payload positions are preserved.

The header, payloads, and proof are then concatenated with a `.` character to form the final compact serialization.

Example compact serialization:

`eyJhbGciOiJCQlMtQkxTMTIifQ.eyJnaXZlbl9uYW1lIjoiSmFuZSIsImZhbWlseV9uYW1lIjoiRG9lIn0~eyJlbWFpbCI6ImphbmVkb2VAZXhhbXBsZS5jb20ifQ~eyJiaXJ0aGRhdGUiOiIwMDAwLTAzLTIyIn0.F9uMuJzNBqj4j-HPTvWjUN_MNoe6KRH0818WkvDn2Sf7kg1P17YpNyzSB-CH57AWDFunU13tL8oTBDpBhODckelTxHIaEfG0rNmqmjK6DOs0_ObksTZh7W3OTbqfD2h4C_wqqMQHSWdXXnojwyFDEg`

## JSON Serialization

Hidden payloads in the JSON serialization are represented with a `null` value.

Example flattened JSON serialization:

```json
{
    "protected":"eyJhbGciOiJCQlMtQkxTMTIifQ",
    "payloads":[
        "eyJnaXZlbl9uYW1lIjoiSmFuZSIsImZhbWlseV9uYW1lIjoiRG9lIn0",
        "eyJlbWFpbCI6ImphbmVkb2VAZXhhbXBsZS5jb20ifQ",
        "eyJiaXJ0aGRhdGUiOiIwMDAwLTAzLTIyIn0"
    ],
    "proof":"F9uMuJzNBqj4j-HPTvWjUN_MNoe6KRH0818WkvDn2Sf7kg1P17YpNyzSB-CH57AWDFunU13tL8oTBDpBhODckelTxHIaEfG0rNmqmjK6DOs0_ObksTZh7W3OTbqfD2h4C_wqqMQHSWdXXnojwyFDEg"
}
```

# Security Considerations

* Requirements for supporting algorithms
* Application interface for verification

# IANA Considerations

This document has no IANA actions.

{backmatter}

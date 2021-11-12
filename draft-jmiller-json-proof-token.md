%%%
title = "JSON Proof Token"
abbrev = "jpa"
docName = "draft-jmiller-json-proof-token-latest"
category = "info"
ipr = "none"
workgroup="todo"
keyword = ["jose", "zkp", "jwp", "jws", "jpt"]

[seriesInfo]
name = "Internet-Draft"
value = "draft-jmiller-json-proof-token"
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

JSON Proof Token (JPT) is a compact, URL-safe, privacy-preserving representation of claims to be transferred between three parties.  The claims in a JPT are encoded as members of JSON objects that are used as the payloads of a JSON Web Proof (JWP) structure, enabling the claims to be digitally signed and selectively disclosed.  JPTs also support reusability and unlinkability when using Zero-Knowledge Proofs (ZKPs).

{mainmatter}

# Introduction

JSON Proof Token (JPT) is a compact claims representation format intended to be used in the same ways as a JSON Web Token (JWT), but with additional support for selective disclosure and unlinkability.  JPTs encode claim values to be transmitted as members of JSON objects that are payloads of a JSON Web Proof (JWP).  JPTs are always represented using the JWP Compact Serialization.

# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 [@!RFC2119] [@RFC8174]
when, and only when, they appear in all capitals, as shown here.

# Background

JWP defines a container binding together a protected header, one or more payloads, and a cryptographic proof.  It does not define how claims are organized into payloads and what formats they are in.  JPTs are intended to be as close to a JWT as possible, while also supporting the selective disclosure and unlinkability of JWPs.

# Design Considerations

The rationale behind the design for JSON Proof Tokens is important when considering how it is structured.  These sections detail the underlying reasoning for the approach defined by JPTs.

## Unlinkability

Supporting unlinkability is perhaps the most challenging design constraint for JPTs.  Even the smallest oversight can introduce a subtle vector for relying parties to collude and correlate one or more subjects across their usage.

The principal tools to prevent this are data minimization and uniformity.  All data included in an individual JPT must be critically minimized to only the values that are cryptographic in nature and able to be selectively disclosed with consent or transformed by the proof algorithm when presented.

Any other data that is repeated across multiple JPTs must be externalized so that it is uniform across every issuance.  This includes preventing the usage of optional headers, dynamic mapping of claims to payloads, changes to how many payloads are included, and the ordering of the payloads.

## Selective Disclosure

While JWPs provide the underling structure for easily supporting selective disclosure, JPTs must go a step further to ensure that applications can effectively provide choice and consent on exactly what is being disclosed.

To accomplish this, it is important that every single payload that is disclosed is understood by the supporting software as to which claim it is and what that value is.  JPTs do not support disclosing claims that are intended to be private from the issuer to the relying party.  All revealed payloads MUST be mapped to claims that are accessible to the application.

## Familiarity

JPTs are intended to as close to a JWT as possible in order to provide the simplest transition for any JWT-based system to add support for a JPT.

Although there are some stark differences in the lifecycle of a JPT, from the application's perspective, the interface to a JPT can be made fairly similar: a JSON object containing a mix of required and optional claims with well-understood values.

The most significant divergence required by JPTs is that of supporting values that may be disclosed or may instead only be a proof about the value.  Applications are required to interact with the JPT on a claim-by-claim basis instead of just verifying a JWT and then being able to interact with the JSON body directly.

## Proofs

In order to generate a variety of ZKPs of knowledge, range, membeship, or other predicates, it is essential that the individual payloads are singular values.  This greatly simplifies the task of linking a derived proof of a given claim to the specific payload that was also signed by the issuer.

While JPTs definitely support protected claims that have more complex object or array compound values, it must also allow and encourage protecting simple claim values individually in a single payload such as strings, numbers, and booleans.

# Layout

A JSON Proof Token is defined as the combination of two different parts: the layout and the payloads. Given the design considerations, the simplest solution is to move the token's encompassing JSON body to an external shared definition, while preserving only the individual claim values in the JWP container.

The layout definition MUST be accessible to and known by all parties that will process the JPT.  Since this is also true of the public key, the ideal location for the layout definition is in the JWK itself. (Note: The layout definition could move to a standalone JSON Proof Key specification.)

A layout is the symbolic equivalent to the JSON body of a JWT, containing all of the claim names along with any additional structures or fixed metadata.  The individual claim values are not included in the layout and instead are replaced by payload references.

These claim value references can be present in two different types: direct and indirect.  A direct reference is always an array with a single integer value, acting as an index into the array of payloads contained in the JPT.  All payloads referenced directly MUST be a string representing a JSON value.

Indirect references are those understood only in the context of supporting applications.  Payloads with indirect references will have content types that vary by the given context and may be textual or binary.  This allows JPTs to include raw values without incurring the penalty of a double-encoding into a JSON-safe string.

Layout definition object, using single-integer-value arrays as the index references to which payload:
```json
{
  "kty": "ZKP",
  "crv": "Bls12381G2",
  "x": "qM4Gi4razIIAXpDSlHB7-pPoo6GOChoBbSLxr7rNwb8mxyVykbmKQGNb0kI7iegDAs9cIwf6DAsCGi7BVs48MG-iw4PsP0L136g2gQpZjrKsr4GbkV5EIx0R2BjIJNfQ",
  "kid": "HjfcpyjuZQ-O8Ye2hQnNbT9RbbnrobptdnExR0DUjU8",
  "alg": "BBS",
  "use": "proof",
  "lyt": {
    "iat": [0],
    "exp": [1],
    "name": [2],
    "email": [3],
    "photo": {
      "type":"image/jpeg",
      "data": 4
    }
  }
}
```

# Payloads

Application resolves each reference as required when processing the layout.  Resolution can result in one of three things:
1. A disclosed JSON value
2. A proof method
3. A `null` value

## Disclosed

* all referenced directly by layout are JSON strings
* may be indirect references w/ non-JSON values

## Proof Methods

* proof methods can be returned instead of a disclosed payload
* these are generated by the algorithm from information in the JWP's proof value
* a proof method may be custom based on the capabilities of the algorithm
* define common proof method types avalable?
  * range
  * membership
  * time
  * knowledge
  * linking

# Example JPT

TBD An example is desperately needed here!

# Security Considerations

* Protected Header Minimization


# IANA Considerations

This document has no IANA actions.

{backmatter}

# Acknowledgements

TBD

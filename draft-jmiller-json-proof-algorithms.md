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

The four principle interactions that every proof algorithm MUST support are `sign`, `verify_signature`, `prove`, and `verify_proof`.

Some algorithms MAY also support two additional interactions of `request_signature` and `request_proof`, but those do not use a JWP container as input or output and are out of scope of this specification.



## Payload Serialization

In JWP all payloads are just an opaque byte array, the container does not convey or retain any knowledge about what the bytes represent.  This is not the case for proof algorithms, in order to support the more advanced capabilities some algorithms may require typed inputs such as blinded values, numbers, or set memberships.





## Sign



# Security Considerations

* Data minimization of the proof value
* Unlinkability

# IANA Considerations

This document has no IANA actions.

{backmatter}

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

%%%

.# Abstract

JSON Proof Token (JPT) is a compact, URL-safe, privacy enabled means of representing claims to be transferred between three parties.  The claims in a JPT are encoded as JSON objects that are used as the payloads of a JSON Web Proof (JWP) structure, enabling the claims to be digitally signed and selectively disclosed.  JPTs also support reusability and unlinkability when using Zero-Knowledge Proofs (ZKPs).

{mainmatter}

# Introduction

The JSON Web Proof (JWP) draft establishes a new secure container format that supports selective disclosure and unlinkability using Zero-Knowledge Proofs (ZKPs) or other newer cryptographic token.

# Conventions and Definitions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this
document are to be interpreted as described in BCP 14 [@!RFC2119] [@RFC8174]
when, and only when, they appear in all capitals, as shown here.

# Background

JWP defines a clean abstraction around the parts of a container binding together a protected header and one or more payloads.  It does not define any details about the interactions between an application and the cryptographic libraries that implement proof-supporting token.

Due to the nature of ZKPs, this specification also documents the subtle but important differences in proof token versus those defined by the JSON Web Token RFC.  These changes help support more advanced capabilities such as blinded signatures and predicate proofs.



# Security Considerations

* Protected Header Minimization
* 

# IANA Considerations

This document has no IANA actions.

{backmatter}

# JSON Web Proof

Specification work for JSON Web Proof

The JSON Web Proof effort aims to establish a new JSON based container as a new entry in the JOSE family of container formats.

While similar to JSON Web Signature[^JWS], JSON Web Proof aim to support newer algorithms and cryptographic techniques. These techniques establish the role of a *prover*, which has limited capabilities to derive new forms of from a signed message which can still be cryptographically verified.

Examples of capabilities an algorithm may support include:

1. Selectively disclose a subset of information to the verifier
2. Provide for multiple uses of a proof container without correlation due to cryptography
3. Disclose an answer to a predicate without disclosing the values used for evaluation
4. Proof of possession

## Specifications in Progress

### JSON Web Proof

A new container, similar to JWS[^JWS], which allows for more than one payload.

* [Editor's Copy](https://ietf-wg-jose.github.io/json-web-proof/#go.draft-ietf-jose-json-web-proof.html)
* [Datatracker Page](https://datatracker.ietf.org/doc/draft-ietf-jose-json-web-proof)
* [Working Group Draft](https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-web-proof)
* [Compare Editor's Copy to Working Group Draft](https://ietf-wg-jose.github.io/json-web-proof/#go.draft-ietf-jose-json-web-proof.diff)

### JSON Proof Algorithms

Required and optional capabilities for algorithms within JSON Web Proof. 

This is loosely analogous to JWA[^JWA], with concrete algorithms defined as separate specifications.

* [Editor's Copy](https://ietf-wg-jose.github.io/json-web-proof/#go.draft-ietf-jose-json-proof-algorithms.html)
* [Datatracker Page](https://datatracker.ietf.org/doc/draft-ietf-jose-json-proof-algorithms)
* [Working Group Draft](https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-proof-algorithms)
* [Compare Editor's Copy to Working Group Draft](https://ietf-wg-jose.github.io/json-web-proof/#go.draft-ietf-jose-json-proof-algorithms.diff)

### JSON Proof Token

An application of JWP for representing claims about an entity, analogous to  JWT[^JWT].

* [Editor's Copy](https://ietf-wg-jose.github.io/json-web-proof/#go.draft-ietf-jose-json-proof-token.html)
* [Datatracker Page](https://datatracker.ietf.org/doc/draft-ietf-jose-json-proof-token)
* [Working Group Draft](https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-proof-token)
* [Compare Editor's Copy to Working Group Draft](https://ietf-wg-jose.github.io/json-web-proof/#go.draft-ietf-jose-json-proof-token.diff)

## Contributing

See the
[guidelines for contributions](https://github.com/ietf-wg-jose/json-web-proof/blob/main/CONTRIBUTING.md).

Contributions can be made by creating pull requests.
The GitHub interface supports creating pull requests using the Edit (✏) button.


### Command Line Usage

Formatted text and HTML versions of the draft can be built using `make`.

```sh
$ make
```

[^JWS]: [JSON Web Signatures - RFC7515][JWS]
[^JWK]: [JSON Web Keys - RFC7517][JWK]
[^JWA]: [JSON Web Algorithms - RFC7518][JWA]
[^JWT]: [JSON Web Token - RFC7519][JWT]

[JWS]: https://datatracker.ietf.org/doc/html/rfc7515
[JWK]: https://datatracker.ietf.org/doc/html/rfc7517
[JWA]: https://datatracker.ietf.org/doc/html/rfc7518
[JWT]: https://datatracker.ietf.org/doc/html/rfc7519

Command line usage requires that you have the necessary software installed.  See
[the instructions](https://github.com/martinthomson/i-d-template/blob/main/doc/SETUP.md).


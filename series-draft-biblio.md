<reference anchor="I-D.ietf-jose-json-web-proof" target="https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-web-proof">
    <front>
        <title>JSON Web Proof</title>
        <author fullname="David Waite" initials="D." surname="Waite">
            <organization>Ping Identity</organization>
        </author>
        <author fullname="Michael B. Jones" initials="M. B." surname="Jones">
            <organization>Self-Issued Consulting</organization>
        </author>
        <author fullname="Jeremie Miller" initials="J." surname="Miller">
            <organization>Ping Identity</organization>
        </author>
        <abstract>
            <t>
The JOSE set of standards established JSON-based container formats for Keys, Signatures, and Encryption. They also established IANA registries to enable the algorithms and representations used for them to be extended. Since those were created, newer cryptographic algorithms that support selective disclosure and unlinkability have matured and started seeing early market adoption. The COSE set of standards likewise does this for CBOR-based containers, focusing on the needs of environments which are better served using CBOR, such as constrained devices and networks. This document defines a new container format similar in purpose and design to JSON Web Signature (JWS) and COSE Signed Messages called a _JSON Web Proof (JWP)_. Unlike JWS, which integrity-protects only a single payload, JWP can integrity-protect multiple payloads in one message. It also specifies a new presentation form that supports selective disclosure of individual payloads, enables additional proof computation, and adds a protected header to prevent replay.
</t>
        </abstract>
    </front>
    <seriesInfo name="Internet-Draft" value="draft-ietf-jose-json-web-proof-latest"/>
</reference>
<reference anchor="I-D.ietf-jose-json-proof-algorithms" target="https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-proof-algorithms">
    <front>
        <title>JSON Proof Algorithms</title>
        <author fullname="Michael B. Jones" initials="M. B." surname="Jones">
            <organization>Self-Issued Consulting</organization>
        </author>
        <author fullname="David Waite" initials="D." surname="Waite">
            <organization>Ping Identity</organization>
        </author>
        <author fullname="Jeremie Miller" initials="J." surname="Miller">
            <organization>Ping Identity</organization>
        </author>
        <abstract>
            <t>
The JSON Proof Algorithms (JPA) specification registers cryptographic algorithms and identifiers to be used with the JSON Web Proof, JSON Web Key (JWK), and COSE specifications. It defines IANA registries for these identifiers.
</t>
        </abstract>
    </front>
    <seriesInfo name="Internet-Draft" value="draft-ietf-jose-json-proof-algorithms-latest"/>
</reference>
<reference anchor="I-D.ietf-jose-json-proof-token" target="https://datatracker.ietf.org/doc/html/draft-ietf-jose-json-proof-token">
    <front>
        <title>JSON Proof Token and CBOR Proof Token</title>
        <author fullname="Michael B. Jones" initials="M. B." surname="Jones">
            <organization>Self-Issued Consulting</organization>
        </author>
        <author fullname="David Waite" initials="D." surname="Waite">
            <organization>Ping Identity</organization>
        </author>
        <author fullname="Jeremie Miller" initials="J." surname="Miller">
            <organization>Ping Identity</organization>
        </author>
        <abstract>
            <t>
JSON Proof Token (JPT) is a compact, URL-safe, privacy-preserving representation of claims to be transferred between three parties. The claims in a JPT are encoded as base64url-encoded JSON objects that are used as the payloads of a JSON Web Proof (JWP) structure, enabling them to be digitally signed and selectively disclosed. JPTs also support reusability and unlinkability when using Zero-Knowledge Proofs (ZKPs). A CBOR-based representation of JPTs is also defined, called a CBOR Proof Token (CPT). It has the same properties of JPTs, but uses the JSON Web Proof (JWP) CBOR Serialization, rather than the JSON-based JWP Compact Serialization.
</t>
        </abstract>
    </front>
    <seriesInfo name="Internet-Draft" value="draft-ietf-jose-json-proof-token-latest"/>
</reference>

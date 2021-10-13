TARGETS_DRAFTS := draft-jmiller-json-web-proof draft-jmiller-json-proof-algorithms 
TARGETS_TAGS := 
draft-jmiller-json-web-proof-00.md: draft-jmiller-json-web-proof.md
	sed -e 's/draft-jmiller-json-web-proof-latest/draft-jmiller-json-web-proof-00/g' $< >$@
draft-jmiller-json-proof-algorithms-00.md: draft-jmiller-json-proof-algorithms.md
	sed -e 's/draft-jmiller-json-proof-algorithms-latest/draft-jmiller-json-proof-algorithms-00/g' $< >$@

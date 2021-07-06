TARGETS_DRAFTS := draft-jmiller-json-web-proofs 
TARGETS_TAGS := 
draft-jmiller-json-web-proofs-00.md: draft-jmiller-json-web-proofs.md
	sed -e 's/draft-jmiller-json-web-proofs-latest/draft-jmiller-json-web-proofs-00/g' $< >$@

SUBDIRS = fixtures
LIBDIR := lib
include $(LIBDIR)/main.mk

.PHONY: $(SUBDIRS)
fixtures:
	@cd fixtures; node --no-warnings nonce.mjs
	@cd fixtures; node --no-warnings bbs-keygen.mjs; node --no-warnings bbs-fixtures.mjs
	@cd fixtures; node --no-warnings es256-keygen.mjs issuer; \
		node --no-warnings es256-keygen.mjs holder; \
		node --no-warnings es256-keygen.mjs ephemeral; \
		node --no-warnings su-es256-fixtures.mjs
	@cd fixtures; node --no-warnings mac-h256-fixtures.mjs; node --no-warnings mac-h256-secret-gen.mjs

$(drafts_xml): fixtures

$(LIBDIR)/main.mk:
ifneq (,$(shell grep "path *= *$(LIBDIR)" .gitmodules 2>/dev/null))
	git submodule sync
	git submodule update $(CLONE_ARGS) --init
else
	git clone -q --depth 10 $(CLONE_ARGS) \
	    -b main https://github.com/martinthomson/i-d-template $(LIBDIR)
endif

clean::
	rm -r fixtures/build

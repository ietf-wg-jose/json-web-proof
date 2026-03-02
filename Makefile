SUBDIRS = fixtures
LIBDIR := lib
include $(LIBDIR)/main.mk

$(LIBDIR)/main.mk:
ifneq (,$(shell grep "path *= *$(LIBDIR)" .gitmodules 2>/dev/null))
	git submodule sync
	git submodule update --init
else
ifneq (,$(wildcard $(ID_TEMPLATE_HOME)))
	ln -s "$(ID_TEMPLATE_HOME)" $(LIBDIR)
else
	git clone -q --depth 10 -b main \
	    https://github.com/martinthomson/i-d-template $(LIBDIR)
endif
endif

.PHONY: $(SUBDIRS)
fixtures:
	@cd fixtures; node --no-warnings build-fixtures.mjs

$(drafts_xml): fixtures

.PHONY: check-fixtures-artifacts check-fixtures-docs update-fixtures-manifests verify-fixtures
check-fixtures-artifacts:
	@npm run check:fixtures:artifacts

check-fixtures-docs:
	@npm run check:fixtures:docs

update-fixtures-manifests: fixtures
	@npm run update:fixtures:manifests

verify-fixtures: fixtures
	@npm run check:fixtures:artifacts
	@npm run check:fixtures:docs
	@npm run lint:fixtures
	@npm test
	@npm run test:random
	@npm run check:repro:fixtures

clean::
	rm -r fixtures/build

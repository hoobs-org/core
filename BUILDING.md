# Building HOOBS
This is the process used to build HOOBS from source.

## HOOBS Core
First you need to build and pack the build

```bash
~]% npm run pack
```

## HOOBS Upgrade Utility
This is the utility used to upgrade older versions of HOOBS or any install using UI-X

First navigate to the homebridte-to-hoobs project root.

Now build and pack.

```bash
~]% npm run pack
```

## Config UI-X for Testing
UI-X doesn't have the capibility to install packages from local files.

First navigate to the homebridge-config-ui-x project root.

Now build and pack.

```bash
~]% npm pack && rm -f ../../HOOBS/hoobs-core/builds/ui-x.tgz && mv ./homebridge-config-ui-x-*.tgz ../../HOOBS/hoobs-core/builds/ui-x.tgz
```

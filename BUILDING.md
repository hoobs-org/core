# Building HOOBS
This is the process used to build HOOBS from source.

HOOBS uses a build script for the many parts of the build process. To view the the options, run this command.

```bash
~]% npm run hoobs --help
```

## HOOBS Core
First you need to build and pack the build

```bash
~]% npm run pack
```

## HOOBS Upgrade Utility
This is the utility used to upgrade older versions of HOOBS or any install using UI-X

First navigate to the homebridge-to-hoobs project root.

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

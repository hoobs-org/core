# Building HOOBS
This is the process used to build HOOBS from source.

HOOBS uses a build script for the many parts of the build process. To view the the options, run this command.

```bash
~]% npm run hoobs -- --help
```

## HOOBS Core
First you need to build

```bash
~]% npm run hoobs build
```

Then to publish run this command

```bash
~]% npm run hoobs publish
```

## HOOBS Upgrade Utility
This is the utility used to upgrade older versions of HOOBS or any install using UI-X.

To build you will need to clone the hoobs-upgrade repository at the same level as hoobs-core.

To build run this.

```bash
~]% npm run hoobs utility build
```

And to publish
```bash
~]% npm run hoobs utility publish
```

## HOOBS Docker Image
HOOBS Core has Docker build files included. From this repository you are able to build the image, create a container locally and control that container.

You will need to install the latest version of Docker Desktop to build.  
[https://hub.docker.com/?overlay=onboarding](https://hub.docker.com/?overlay=onboarding)

HOOBS uses Docker Buildx for it's images. You will need to edit the Docker Desktop settings and enable the "Expermental" tools. Here is some more information on this.  
[https://docs.docker.com/buildx/working-with-buildx/](https://docs.docker.com/buildx/working-with-buildx/)

Building the image.

```bash
~]% npm run hoobs docker build
```

Creating the HOOBS container locally

```bash
~]% npm run hoobs docker create
```

Start the HOOBS container locally

```bash
~]% npm run hoobs docker start
```

Stop the HOOBS container locally

```bash
~]% npm run hoobs docker stop
```

Removing the local HOOBS container

```bash
~]% npm run hoobs docker remove
```

> Note. You can rebuild the docker container without re-creating it. Simply stop it, build it and then start the container.

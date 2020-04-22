## Testing HOOBS
This is the testing process used to test HOOBS berfore releasing.

## Enviornment
To test, you need to first setup HOOBS. If you don't have HOOBS installed run this command.

```bash
sudo npm install -g --unsafe-perm @hoobs/hoobs
```

This will install the current released version. Skip this step if you already have a version of HOOBS installed.

You can also skip this step if you wish to test an install from scratch.

## Download
Now using a computer that has SSH access to your device, navigate to the hoobs-core repository and download the latest HOOBS pre-release.

[https://github.com/hoobs-org/hoobs-core/releases](https://github.com/hoobs-org/hoobs-core/releases)

> Note: I am assuming that you are using a Mac, and you downloaded the file to your Downloads folder.

Now you need to push the file to your device. But first you need to check to see if the file already exists and delete it.

```bash
~]% ssh hoobs@hoobs.local
~]$ rm -f ~/hoobs-core.tgz
```

Now exit your SSH session.

```bash
~]$ exit
```

Now push the `hoobs-core.tgz` file to your device.

```bash
~]% scp ~/Downloads/hoobs-core.tgz hoobs@hoobs.local:~/
```

Now SSH back in to your device. And set the permissions on the file.

```bash
~]% ssh hoobs@hoobs.local
~]$ chmod 755 ~/hoobs-core.tgz
```

## Install
Now you are ready to update the code.

```bash
~]$ sudo npm install -g --unsafe-perm ~/hoobs-core.tgz
```

Once the install is finished, you will need to reboot.

```bash
~]$ sudo shutdown -r now
```

> Note: I know there is a reboot command, but not all operating systems have it. Plus this is what the upgrade process does, so it is best to use the same commands.

Or you can restart the HOBOS service.

```bash
~]% sudo systemctrl stop hoobs
~]% sudo systemctrl start hoobs
```

## Test the 2.1.1 Upgrade Process
We also can test upgrading to 3.0.0 from 2.1.1. You will need to upload more NPM packages. This also requires a modified version of UI-X.

First download the other files in the release.

* ui-x.tgz
* homebridge-to-hoobs.tgz

Now using a computer that has SSH access to your device, navigate to the hoobs-core repository and download the latest HOOBS pre-release.

[https://github.com/hoobs-org/hoobs-core/releases](https://github.com/hoobs-org/hoobs-core/releases)

> Note: I am assuming that you are using a Mac, and you downloaded the file to your Downloads folder.

Now you need to push the files to your device. But first you need to check to see if the files already exists and delete them.

```bash
~]% ssh hoobs@hoobs.local
~]$ rm -f ~/ui-x.tgz
~]$ rm -f ~/homebridge-to-hoobs.tgz
```

Now exit your SSH session.

```bash
~]$ exit
```

Now push the `ui-x.tgz` and `homebridge-to-hoobs.tgz` files to your device.

```bash
~]% scp ~/Downloads/ui-x.tgz hoobs@hoobs.local:~/
~]% scp ~/Downloads/homebridge-to-hoobs.tgz hoobs@hoobs.local:~/
```

Now SSH back in to your device. And set the permissions on the file.

```bash
~]% ssh hoobs@hoobs.local
~]$ chmod 755 ~/ui-x.tgz
~]$ chmod 755 ~/homebridge-to-hoobs.tgz
```

## Install UI-X
Now you need to install the modified version of UI-X.

```bash
~]$ sudo npm install -g --unsafe-perm ~/ui-x.tgz
```

> Note: This version of UI-X will only install the homebridge-to-hoobs plugin from a local source. Do NOT ise this if you want to keep using this device for anything but testing.

Once the install is finished, you will need to reboot.

```bash
~]$ sudo shutdown -r now
```

## Install the HOOBS Migration Utility
In the UI-X interface. Navigate to the plugins page and search for `to-hoobs` and click Install.

[https://github.com/hoobs-org/HOOBS/wiki/2.3-Upgrading-HOOBS](https://github.com/hoobs-org/HOOBS/wiki/2.3-Upgrading-HOOBS)

The upgrade process should follow the instructions.

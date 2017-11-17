# Google Compute Engine Instance Toggler

A Node js webserver that allows anybody online to start or stop a Google Cloud Engine instance via browser.
Wrote this because I was tired of texting my friend to ask him to turn on the Minecraft server, but you can use it for whatever.

## Setup

In the GCP web console in your browser:
1) Create auth key for exteranl applications
search for API, click Credentails
create new service accout key
download key file and rename it to cred.json (you'll need this in a sec)

On the computer you want to run the server on:
1) Clone this repo.
2) Install Node js.
3) Edit config.json to include your values for project, zone, and instance.
4) Replace the cred.json in the cloned repository with the one you downloaded above.
5) Build (npm install)
6) Run (sudo node server.js)
7) Use (Runs on default http port 80)

To run this on a fresh GCP instance:
Create new Instance (Debian GNU/Linux 9 (stretch)) be sure to allow http traffic.
Download, install and build:
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y git-core
git clone https://github.com/thbrown/google-compute-engine-instance-toggler.git
cd google-compute-engine-instance-toggler
npm install
```
Fix values in config.json. 
Replace cred.json with your key.
Run the server with:
```
screen
sudo node server.js
ctrl+a, d
```
You can now end the ssh session. You should then be able to see the server publicly from any brower.
If you want, you can terminate the server later:
```
screen -r
crtl+c
```

## Notes
This will proably be much more useful to you if you have some script that runs your stuff automatically on startup in your GCP instance.

I like to run this on a GCP micro instance (since it's free).

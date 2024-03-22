<pre style="color: #f55; background-color: transparent;">
*####     *###     =############################################################################### 
 ####.   .####+    ####:                                                                            
 *###+   *#####   .###*   .-===-.       :-====   :-====:    :-==-:     .:::     :::     :-===-:     
 :####   ######=  *###: =####*####*   #######= ######*##############   ####.   *###*  #####**####=  
  *###= =##==###  ####         -###+  ####-    ####-   :####    *###+  ####.   *###*  ####:   -###* 
  :###*.###  ###==###:    -*#######*  ####-    *###-   :####    +###+  ####.   *###*  ####:    ####.
   *###*##+  =#######  :###*.  :###*  ####-    *###-   .####    +###*  ####.   *###*  ####:    ####.
   -######    ######=  *###    :###*  ####-    *###-   .####    +###*  ####.   *###*  ####:   :#### 
    #####=    =#####   +####   -###*  ####-    ####-   .####    +###*  +####*-+####*  ####= .*####  
    :###*      *###:     =*#######+.  ####:    *###:   .####    =###+    =#######*=   #########=    
                                                                                      ####:         
                                                                                      ####:     -:  
                                                                                      *#*#:     :.  
</pre>

# Warmup Homebridge Plugin <!-- omit in toc -->

## Introduction <!-- omit in toc -->

Unofficial [Homebridge](https://homebridge.io) plugin exposing to Apple's [HomeKit](http://www.apple.com/ios/home/) [Warmup smart thermostats](https://www.warmup.co.uk/thermostats/smart). NB. Currently, only the [4iE](https://www.warmup.co.uk/thermostats/smart/4ie-underfloor-heating) is known to work.

Warmup Homebridge Plugin automatically discovers your Warmup thermostats.

- [Using the plugin](#using-the-plugin)
  - [Installation](#installation)
- [Temperature Control](#temperature-control)
- [Mode Setting](#mode-setting)
- [Developing](#developing)
  - [Clone and install dependencies](#clone-and-install-dependencies)
  - [Testing](#testing)
  - [Building and publishing](#building-and-publishing)
- [Credits](#credits)

## Using the plugin

You will need a [MyWarmup](https://my.warmup.com) account. All thermostats are retrieved from the [my.warmup.com](https://my.warmup.com) site, and are automatically created in the Home App.

You will also need a server running [Homebridge](https://homebridge.io).

### Installation

Install the plugin by searching for "Warmup Homebridge Plugin" through the Homebridge Plugins UI or manually by:

```sh
$ sudo npm -g i homebridge-plugin-warmup
```

Use the plugin Config UI X to login to your account and all the thermostats you own will be added to Homebridge.

## Temperature Control

Changes to the temperature create a temperature override for the current setting.  Length of the override defaults to 60 Minutes ( or the duration setting).  

## Mode Setting

`Off` - Turns off the thermostat
`Heat` - Overrides the current target temperature for 60 minutes
`Auto` - Resumes the current program's schedule and temperature

## Developing

### Clone and install dependencies

```sh
git clone git@github.com:jondarrer/homebridge-plugin-warmup
cd homebridge-plugin-warmup
npm install
```

### Testing

Run the tests with the usual command:

```sh
npm test
```

This will run the tests with a coverage report (requires 100% across the board to pass), which you can view with:

```sh
open coverage/lcov-report/index.html
```

### Building and publishing

```sh
npm run build
npm version bump
git push --tags
```

## Credits

Thanks to [NorthernMan54](https://github.com/NorthernMan54) for his [homebridge-warmup4ie](https://github.com/NorthernMan54/homebridge-warmup4ie) plugin, which served as a basis for some of the logic in this one.

[ASCII Art Archive](https://www.asciiart.eu/image-to-ascii) was used to generate the ASCII art from Warmup's logo.

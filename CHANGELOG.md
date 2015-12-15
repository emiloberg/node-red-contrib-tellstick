# node-red-contrib-tellstick changelog

## 2.1.1

Fixed missing changelog

## 2.1.0

Added support for Node 0.12+

## 2.0.0

### Possible breaking changes

**The _tellstick-out_ node now sends the same command multiple times** to ensure that at least one of them reaches the receiver.

As the Tellstick just sends radio signals without any way of knowing if the transmission reched its goal, sometimes signals gets lost in space.

To mitigate this. The _tellstick-out_ now sends the same command multiple times.

By default, it sends the same command 5 times with an interval of 500 milliseconds (0.5 seconds) between each command. You can tweak these settings but editing the `settings.js` file in your Node-RED directory (the path to the settings file is printed in the console when you're starting Node-RED).

The new settings are:

```
functionGlobalContext: {
	repeatSendTimes: 5,
	repeatSendInterval: 500
}
```

#### Why could this be breaking?

Imagine that you have a flow that will turn on a lamp (command A) and directly thereafter turn off that lamp (command B). 

Then the command A will turn the lamp on, then command B will turn the lamp off. Then the command A will emit it's second signal, turning the lamp on again. Command B will emit it's second signal, turning the lamp on - and so on.

If you have a flow as such, then set `repeatSendTimes` to `1`. However, this should really be a corner case.
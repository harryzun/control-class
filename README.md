# Control Class
![NPM Downloads](https://img.shields.io/npm/dt/control-class.svg)
![NPM Version](https://img.shields.io/npm/v/control-class.svg)
![License](https://img.shields.io/npm/l/control-class.svg)

Control Class is a Java-like access control ponyfill for ES6 (JavaScript) classes. This essentially allows you to use keywords like public, private, static, and final without polluting the global scope.

This is made possible by various features of ES6/ES2015 such as the spread/rest operator, WeakMaps, and class syntax. It therefore requires Node.js 6.5.0 or later to function properly. Transpilation to ES5 may also be possible with a WeakMap polyfill.

Please note that this is an experimental proof of concept. This should not be used in any production environment. Also, support for protected variables (variables hidden from subclasses) has not been added yet.
## Installation
```bash
$ npm install control-class
```
## Usage
Import or require Control Class in each module you want to declare a controlled class.
```node
const ControlClass = require('control-class')
```
Create a new instance of Control Class. The Control Class constructor takes two parameters: variable delcarations (required) and options (optional). Creating this class will return an object with three important functions and classes: $_, BaseClass, and extendable. See examples below for details on how to use them.
```node
let { $_, BaseClass, extendable } = new ControlClass(declarations, options)
```
When declaring your class extend BaseClass regardless of whether or not you are actually extending any super class.
```node
class MyClass extends BaseClass {
  constructor(arg) {
    super()
  }
}
```
You can access all declared variables within the class by wrapping 'this' with the '$\_' function. '$\_(this)' is only required for private variables; public variables can be accessed with both '$_(this)' and 'this'.
```node
$_(this).var = 'value'
```
If you want to make the class extendable, export the class after passing it through the extendable() function. You are expected to use one class per Node module (JS file), similar to Java classes.
```node
module.exports = extendable(Person)
```
### Variable Declaration
When creating a new Control Class, the first parameter is the variable declaration. The declaration is expected to be an object; the most common implementation is shown below (see examples for other methods).
```node
{
  varName: {
    value: 'YOUR_DEFAULT_VALUE',
    public: true,
    static: false,
    final: false
  },
  [...]
}
```
#### Default Values
Attribute | Default
------------ | -------------
value | none *[required]*
public | true
static | false
final | false
### Options
Control Class has a second optional parameter, used for passing an options object.

Option | Description
------------ | -------------
extends | Reference to the class you are extending
## Examples
### Declaring Variables
Before declaring your class, you must first create a new Control Class. You declare all variables here, much like the beginning of a Java class, or a header file in C.
```node
const ControlClass = require('control-class')

let { $_, BaseClass, extendable } = new ControlClass({
  public: {
    nickname: {
      value: 'Joe',
      static: false,
      final: false
    }
  },
  private: {
    firstName: {
      value: 'John',
      static: false,
      final: false
    },
    lastName: {
      value: 'Hancock',
      static: false,
      final: false
    }
  }
})
```
You may also use shorthand to declare variables. Control Class will assume they are both mutable (non-final) and instanced (non-static).
```node
const ControlClass = require('control-class')

let { $_, BaseClass, extendable } = new ControlClass({
  public: {
    nickname: 'Joe'
  },
  private: {
    firstName: 'John',
    lastName: 'Hancock',
    species: {
      value: 'human',
      static: true,
      final: true
    }
  }
})
```
If you prefer, you may also specify whether a variable is public within each variable declaration. However, you may not use shorthand syntax this way.
```node
const ControlClass = require('control-class')

let { $_, BaseClass, extendable } = new ControlClass({
  nickname: {
    value: 'Joe',
    public: true,
    static: false,
    final: false
  },
  firstName: {
    value: 'John',
    public: false,
    static: false,
    final: false
  },
  lastName: {
    value: 'Hancock',
    public: false,
    static: false,
    final: false
  }
})
```
### Declaring a Class
Creating a new Control Class returns an object with three attributes: $_, BaseClass, and extendable. You will need these to use Control Class with any class you declare.
```node
class Person extends BaseClass {
  constructor(firstName, lastName, nickname) {
    super()
    if (firstName) $_(this).firstName = firstName
    if (lastName) $_(this).lastName = lastName
    if (nickname) $_(this).nickname = nickname
  }

  get name() {
    return $_(this).firstName+' '+$_(this).lastName
  }
}

module.exports = extendable(Person)
```
### Extending a Class
You may extend a class that uses Control Class by requiring the class you want to extend, and pass it as the 'extends' option after your variable declarations. You still extend 'BaseClass' when you declare your new subclass. If you use a constructor you must use super() to call the super class constructor.
```node
const ControlClass = require('control-class')
const Person = require('./Person.js')

let { $_, BaseClass, extendable } = new ControlClass({
  favoriteLanguage: {
    value: null,
    public: false,
    static: false,
    final: false
  }
}, { extends: Person })

class Developer extends BaseClass {
  constructor(firstName, lastName, nickname, favoriteLanguage) {
    super(firstName, lastName, nickname)
    $_(this).favoriteLanguage = favoriteLanguage
  }

  get favoriteLanguage() {
    return $_(this).favoriteLanguage
  }

  set favoriteLanguage(favoriteLanguage) {
    $_(this).favoriteLanguage = favoriteLanguage
  }
}

module.exports = extendable(Developer)
```
## Credits
Control Class was created by [Harry Hanssen](http://hzn.la)
## License
[The MIT License](http://opensource.org/licenses/MIT)

// weak map indexed by SuperClass
let extendVars = new WeakMap()  // stores variable declarations ('vars' variable) for subclass and link it to parent class name
let staticVars = []             // stores static variables for access

// export ControlClass class
module.exports = function(vars, options = {}) {
  let SuperClass = options.extends  // set SuperClass from options

  // arrays indexed by var name
  let publicLedger = {}		// each true if public or false if private
  let staticLedger = {}		// each true if static or false if instanced
  let finalLedger = {}		// each true if final or false if mutable
  let instanceTemplate = {}	// stores instance variables before assigned to a class
  let extendTemplate = {}	// stores variable declarations ('vars' variable) for subclass before extendable is called
  let staticPointers = {} // stores indices of static variables

  // weak map indexed by 'this'
  let instanceVars = new WeakMap()  // stores instance variables for access

  // Check for SuperClass variables
  if (SuperClass) {
    let extendVarsBuffer = extendVars.get(SuperClass)
    if (extendVarsBuffer) {
      extendTemplate = extendVarsBuffer
    } else
      SuperClass = class {}
  } else {
    SuperClass = class {}
  }

  function createStaticVar(n, v, p = false) {
    if (!p && p !== 0 && p !== '0') {
      p = staticVars.length
      staticVars[p] = v
    }
    return staticPointers[n] = p
  }

  function setStaticVar(n, v) {
    let p = staticPointers[n]
    return staticVars[p] = v
  }

  function getStaticVar(n) {
    let p = staticPointers[n]
    return staticVars[p]
  }

  // Used to access vars (internally)
  class VarHandler {
    constructor(_this) {
      this._this = _this
    }
  }

  // Wrapper for VarHandler
  function $_(_this) {
    return new VarHandler(_this)
  }

  // Must be extended to expose vars
  class BaseClass extends SuperClass {
    constructor(...args) {
      super(...args)

      if (this.constructor === BaseClass) {
        throw new Error('Can\'t instantiate abstract class!');
		  }

      instanceVars.set(this, Object.assign({}, instanceTemplate))

      // Expose public non-static vars
      for (let n of Object.keys(publicLedger)) {
        if (publicLedger[n] && !staticLedger[n]) {
          BaseClass.prototype.__defineGetter__(n, function() {
            return $_(this)[n]
          })
          BaseClass.prototype.__defineSetter__(n, function(v) {
            $_(this)[n] = v
          })
        }
      }
    }
  }

  // Must be called before creating class
  function defineClassVars(vars) {
    // Restructure vars from: { public: { varName: options } } to: { varName: options }
    let varsBuffer = {}
    if ('public' in vars) {
      for (let n of Object.keys(vars.public)) {
        if (Object.keys(varsBuffer).length > 0 && n in varsBuffer) // Check for duplicate variable names
          throw new Error(`The field '${n}' cannot be redeclared`)
        if (vars.public[n] != null && typeof vars.public[n] == 'object' && 'value' in vars.public[n])
          varsBuffer[n] = Object.assign({}, vars.public[n], { public: true })
        else
          varsBuffer[n] = { public: true, value: vars.public[n] }
        delete varsBuffer[n].pointer
      }
    }
    if ('private' in vars) {
      for (let n of Object.keys(vars.private)) {
        if (Object.keys(varsBuffer).length > 0 && n in varsBuffer) // Check for duplicate variable names
          throw new Error(`The field '${n}' cannot be redeclared`)
        if (vars.private[n] != null && typeof vars.private[n] == 'object' && 'value' in vars.private[n])
          varsBuffer[n] = Object.assign({}, vars.private[n], { public: false })
        else
          varsBuffer[n] = { public: false, value: vars.private[n] }
        delete varsBuffer[n].pointer
      }
    }
    if (Object.keys(varsBuffer).length > 0) vars = varsBuffer

    // Check for duplicate variable names
    if (Object.keys(extendTemplate).length > 0) {
      varsBuffer = {}
      for (let n of Object.keys(extendTemplate)) {
        if (Object.keys(vars).length > 0 && n in vars)
          throw new Error(`The field '${n}' cannot be redeclared`)
        if (Object.keys(varsBuffer).length > 0 && n in varsBuffer)
          throw new Error(`The field '${n}' cannot be redeclared`)
        varsBuffer[n] = extendTemplate[n]
      }
    }

    vars = Object.assign({}, vars, extendTemplate) // Merge extendTemplate with vars
    extendTemplate = Object.assign({}, vars) // Prepare extendTemplate for next subclass

    // Iterate each of the variables to be created
    for (let n of Object.keys(vars)) {
      let v = vars[n]

      if (typeof v == 'object' && ('value' in v || 'public' in v || 'static' in v || 'final' in v)) { // standard syntax
        if (v.public == null) v.public = true	// defaults to public
        if (v.static == null) v.static = false	// defaults to instanced (non-static)
        if (v.final == null) v.final = false	// defaults to mutable (non-final)
      } else { // shorthand syntax
        v = {
          value: v,
          public: true,
          static: false,
          final: false
        }
      }

      if (v.static) { // add static variable to static var and update pointer for extending
        v.pointer = createStaticVar(n, v.value, v.pointer)
      } else { // add instanced variable to instanced var object
        instanceTemplate[n] = v.value
      }

      publicLedger[n] = v.public
      staticLedger[n] = v.static
      finalLedger[n] = v.final

      // Internally expose vars to class
      VarHandler.prototype.__defineGetter__(n, function() {
        if (staticLedger[n]) // variable is static
          return getStaticVar(n)
        else // variable is instanced
          return instanceVars.get(this._this)[n]
      })
      VarHandler.prototype.__defineSetter__(n, function(v) {
        if (staticLedger[n]) { // variable is static
          if (finalLedger[n] && getStaticVar(n) != null) // check if final
            throw new Error(`The final field '${n}' cannot be reassigned`)

          setStaticVar(n, v)
        } else { // variable is instanced
          let varsBuffer = instanceVars.get(this._this)

          if (finalLedger[n] && varsBuffer[n] != null) // check if final
            throw new Error(`The final field '${n}' cannot be reassigned`)

          varsBuffer[n] = v
          instanceVars.set(this._this, varsBuffer)
        }
      })

      // Expose public static vars
      if (v.public && v.static) {
        BaseClass.prototype.__defineGetter__(n, function() {
          return getStaticVar(n)
        })
        BaseClass.prototype.__defineSetter__(n, function(v) {
          if (finalLedger[n] && getStaticVar(n) != null) // check if final
            throw new Error(`The final static field '${n}' cannot be reassigned`)
          setStaticVar(n, v)
        })
        BaseClass.__defineGetter__(n, function() {
          return getStaticVar(n)
        })
        BaseClass.__defineSetter__(n, function(v) {
          if (finalLedger[n] && getStaticVar(n) != null) // check if final
            throw new Error(`The final static field '${n}' cannot be reassigned`)
          setStaticVar(n, v)
        })
      }
    }
  }

  // Must be called before extending BaseClass's SubClass
  function extendable(SuperClass) {
    extendVars.set(SuperClass, Object.assign({}, extendTemplate))

    return SuperClass
  }

  defineClassVars(vars)
  return { $_, BaseClass, extendable }
}

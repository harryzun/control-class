var { expect, should } = require('chai')
var ControlClass = require('./index')

// bind should() to all objects
should()

// Create variable declaration object with all possible options
function defineAllVars(verbose = true, suffix = '') {
	let vars = verbose ? {} : { public: {}, private: {} }

	// Standard syntax
	for (let pub = 0; pub < 2; pub++) {
		for (let stat = 0; stat < 2; stat++) {
			for (let fin = 0; fin < 2; fin++) {
				let varString =
					(pub ? 'pub' : 'priv') +
					(stat ? 'Stat' : 'Inst') +
					(fin ?	'Fin' : 'Mut') +
					suffix
				if (verbose) { // format: { varName: { public: boolean } }
					vars[varString] = {
						value: varString,
				    public: pub,
				    static: stat,
				    final: fin
					}
				} else { // format: { public: { varName: {} } }
					if (pub) {
						vars.public[varString] = {
							value: varString,
					    static: stat,
					    final: fin
						}
					} else {
						vars.private[varString] = {
							value: varString,
					    static: stat,
					    final: fin
						}
					}
				}
			}
		}
	}

	// Shorthand syntax
	if (verbose) { // format: { varName: { public: ? } }
		vars['pubShort'+suffix] = 'pubShort'+suffix
		vars['pubMed'+suffix] = {
			value: 'pubMed'+suffix
		}
		vars['privShort'+suffix] = { // Duplicated only for consistency
			value: 'privShort'+suffix,
			public: false
		}
		vars['privMed'+suffix] = {
			value: 'privMed'+suffix,
			public: false
		}
	} else { // format: { public: { varName: {} } }
		vars.public['pubShort'+suffix]  = 'pubShort'+suffix
		vars.public['pubMed'+suffix]  = {
			value: 'pubMed'+suffix
		}
		vars.private['privShort'+suffix] = 'privShort'+suffix
		vars.private['privMed'+suffix] = {
			value: 'privMed'+suffix
		}
	}

	return vars
}

describe('ControlClass', function() {
	it('should return three methods', function() {
		let controlClass = new ControlClass(defineAllVars(), { test: true })
		controlClass.should.have.property('$_')
		controlClass.should.have.property('BaseClass')
		controlClass.should.have.property('extendable')
	})

  describe('single class', function() {
		let CC, ShortCC, declarations
		beforeEach(function() {
			declarations = defineAllVars() // generate variable declarations
			CC = new ControlClass(declarations, { test: true }) // format: { varName: { public: ? } }
			ShortCC = new ControlClass(defineAllVars(false), { test: true })  // format: { public: { varName: {} } }
		})

		it('should have all declared public variables', function() {
			let { $_, BaseClass } = CC
			class Class extends BaseClass {
				constructor() {
					super()

					// test internal access
					for (let name in declarations) {
						if (name.includes('pub')) $_(this).should.have.property(name).which.equals(name)
					}
				}
			}
			let object = new Class()

			let { $_: _$, BaseClass: ShortBaseClass } = ShortCC
			class ShortClass extends ShortBaseClass {
				constructor() {
					super()

					// test internal access
					for (let name in declarations) {
						if (name.includes('pub')) _$(this).should.have.property(name).which.equals(name)
					}
				}
			}
			let shortObject = new ShortClass()

			// test external access
			for (let name in declarations) {
				if (name.includes('pub')) {
					object.should.have.property(name).which.equals(name)
					shortObject.should.have.property(name).which.equals(name)
				}
			}
		})

		it('should have all declared private variables', function () {
			let { $_, BaseClass } = CC
			class Class extends BaseClass {
				constructor() {
					super()

					// test internal access
					for (let name in declarations) {
						if (name.includes('priv')) $_(this).should.have.property(name).which.equals(name)
					}
				}
			}
			let object = new Class()

			let { $_: _$, BaseClass: ShortBaseClass } = ShortCC
			class ShortClass extends ShortBaseClass {
				constructor() {
					super()

					// test internal access
					for (let name in declarations) {
						if (name.includes('priv')) _$(this).should.have.property(name).which.equals(name)
					}
				}
			}
			let shortObject = new ShortClass()

			// ensure no external access
			for (let name in declarations) {
				if (name.includes('priv')) {
					object.should.not.have.property(name)
					shortObject.should.not.have.property(name)
				}
			}
		})

		it('should have static variables that are shared', function() {
			let { $_, BaseClass } = CC
			class Class extends BaseClass {
				constructor() {
					super()
				}

				setPrivate(value) {
					$_(this).privStatMut = value
				}

				getPrivate() {
					return $_(this).privStatMut
				}
			}
			let object1 = new Class()
			let object2 = new Class()

			// test public variables
			object1.pubStatMut = 'foo'
			object2.pubStatMut.should.equal('foo')

			// test private variables
			object1.setPrivate('bar')
			object2.getPrivate().should.equal('bar')
		})

		it('should have instanced variables that are not shared', function() {
			let { $_, BaseClass } = CC
			class Class extends BaseClass {
				constructor() {
					super()
				}

				setPrivate(name, value) {
					$_(this)[name] = value
				}

				getPrivate(name) {
					return $_(this)[name]
				}
			}
			let object1 = new Class()
			let object2 = new Class()

			// test public variables
			for (let name in declarations) {
				if (name.includes('pub') && !name.includes('Stat') && !name.includes('Fin')) {
					object1[name] = 'foo'
					object2[name].should.not.equal('foo')
				}
			}

			// test private variables
			for (let name in declarations) {
				if (name.includes('priv') && !name.includes('Stat') && !name.includes('Fin')) {
					object1.setPrivate(name, 'bar')
					object2.getPrivate(name).should.not.equal('bar')
				}
			}

			let { $_: _$, BaseClass: ShortBaseClass } = ShortCC
			class ShortClass extends ShortBaseClass {
				constructor() {
					super()
				}

				setPrivate(name, value) {
					_$(this)[name] = value
				}

				getPrivate(name) {
					return _$(this)[name]
				}
			}
			let object3 = new ShortClass()
			let object4 = new ShortClass()

			// test public variables
			for (let name in declarations) {
				if (name.includes('pub') && !name.includes('Stat') && !name.includes('Fin')) {
					object3[name] = 'foo'
					object4[name].should.not.equal('foo')
				}
			}

			// test private variables
			for (let name in declarations) {
				if (name.includes('priv') && !name.includes('Stat') && !name.includes('Fin')) {
					object3.setPrivate(name, 'bar')
					object4.getPrivate(name).should.not.equal('bar')
				}
			}
		})

		it('should have final variables that can not change', function() {
			let { $_, BaseClass } = CC
			class Class extends BaseClass {
				constructor() {
					super()
				}

				setPrivate(name, value) {
					$_(this)[name] = value
				}
			}
			let object = new Class()

			// test public variables
			for (let name in declarations) {
				if (name.includes('pub') && name.includes('Fin')) {
					function pitcher() {
						object[name] = 'foo'
					}
					expect(pitcher).to.throw()
				}
			}

			// test private variables
			for (let name in declarations) {
				if (name.includes('priv') && name.includes('Fin')) {
					function pitcher() {
						object.setPrivate(name, 'bar')
					}
					expect(pitcher).to.throw()
				}
			}
		})

		it('should have mutable variables that can change', function() {
			let { $_, BaseClass } = CC
			class Class extends BaseClass {
				constructor() {
					super()
				}

				setPrivate(name, value) {
					$_(this)[name] = value
				}

				getPrivate(name) {
					return $_(this)[name]
				}
			}
			let object1 = new Class()

			// test public variables
			for (let name in declarations) {
				if (name.includes('pub') && !name.includes('Fin')) {
					object1[name] = 'foo'
					object1[name].should.equal('foo')
				}
			}

			// test private variables
			for (let name in declarations) {
				if (name.includes('priv') && !name.includes('Fin')) {
					object1.setPrivate(name, 'bar')
					object1.getPrivate(name).should.equal('bar')
				}
			}

			let { $_: _$, BaseClass: ShortBaseClass } = ShortCC
			class ShortClass extends ShortBaseClass {
				constructor() {
					super()
				}

				setPrivate(name, value) {
					_$(this)[name] = value
				}

				getPrivate(name) {
					return _$(this)[name]
				}
			}
			let object2 = new Class()

			// test public variables
			for (let name in declarations) {
				if (name.includes('pub') && !name.includes('Fin')) {
					object2[name] = 'foo'
					object2[name].should.equal('foo')
				}
			}

			// test private variables
			for (let name in declarations) {
				if (name.includes('priv') && !name.includes('Fin')) {
					object2.setPrivate(name, 'bar')
					object2.getPrivate(name).should.equal('bar')
				}
			}
		})
  })

	describe('extended class', function() {
		let SupCC, newSupClass, SubCC, supVars, subVars
		beforeEach(function() {
			supVars = defineAllVars(true, 'Sup') // generate super class variable declarations
			SupCC = new ControlClass(supVars, { test: true }) // super class helper
			class SupClass extends SupCC.BaseClass { // super class definition
				constructor() {
					super()
				}
			}
			newSupClass = () => new SupClass()
			subVars = defineAllVars(true, 'Sub') // generate sub class variable declarations
			SubCC = new ControlClass(subVars, { extends: SupCC.extendable(SupClass), test: true })  // sub class helper
		})

		it('should have all public variables from the super class', function() {
			let { $_, BaseClass } = SubCC
			class SubClass extends BaseClass {
				constructor() {
					super()

					// test internal access
					for (let name in supVars) {
						if (name.includes('pub')) $_(this).should.have.property(name).which.equals(name)
					}
				}
			}
			let subObject = new SubClass()

			// test external access
			for (let name in supVars) {
				if (name.includes('pub')) subObject.should.have.property(name).which.equals(name)
			}
		})

		it('should have all private variables from the super class', function() {
			let { $_, BaseClass } = SubCC
			class SubClass extends BaseClass {
				constructor() {
					super()

					// test internal access
					for (let name in supVars) {
						if (name.includes('priv')) $_(this).should.have.property(name).which.equals(name)
					}
				}
			}
			let subObject = new SubClass()

			// ensure no external access
			for (let name in supVars) {
				if (name.includes('priv')) subObject.should.not.have.property(name)
			}
		})

		it('should have all newly declared public variables', function() {
			let { $_, BaseClass } = SubCC
			class SubClass extends BaseClass {
				constructor() {
					super()

					// test internal access
					for (let name in subVars) {
						if (name.includes('pub')) $_(this).should.have.property(name).which.equals(name)
					}
				}
			}
			let subObject = new SubClass()

			// test external access
			for (let name in subVars) {
				if (name.includes('pub')) subObject.should.have.property(name).which.equals(name)
			}
		})

		it('should have all newly declared private variables', function() {
			let { $_, BaseClass } = SubCC
			class SubClass extends BaseClass {
				constructor() {
					super()

					// test internal access
					for (let name in subVars) {
						if (name.includes('priv')) $_(this).should.have.property(name).which.equals(name)
					}
				}
			}
			let subObject = new SubClass()

			// ensure no external access
			for (let name in subVars) {
				if (name.includes('priv')) subObject.should.not.have.property(name)
			}
		})

		it('should have static variables that are shared with the super class', function() {
			let supObject = newSupClass()

			let { $_, BaseClass } = SubCC
			class SubClass extends BaseClass {
				constructor() {
					super()
				}
			}
			let subObject = new SubClass()

			supObject.pubStatMutSup = 'foo'
			subObject.pubStatMutSup.should.equal('foo')
		})
	})
})

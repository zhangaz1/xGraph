(function World() {
	var async = require('async');
	var fs = require('fs');

	//-----------------------------------------------------dispatch
	var dispatch = {
		Setup: Setup,
		Start: Start,
		AddModel: AddModel,
		GetGraph: GetGraph,
		SetPosition: SetPosition,
		'*': Relay
	};

	return {
		dispatch: dispatch
	};

	function Setup(com, fun) {
		console.log('--World/Setup');
		this.Vlt.Graph = [];
		if(fun)
			fun();
	}

	function Start(com, fun) {
		console.log('--World/Start');
		if(fun)
			fun();
	}

	//-----------------------------------------------------AddModel
	function AddModel(com, fun) {
		console.log('--World/AddModel');
		var that = this;
		var Par = this.Par;
		var mod = {};
		mod.Module = "xGraph:Scene/Model";
		mod.Par = {};
		mod.Par.Loc = com.Loc;
		mod.Par.Name = com.Name;
		var path = path = 'models/' + com.Name;
		console.log('path', path);
		fs.exists('models', function(yes) {
			if(yes) {
				stuffit();
			} else {
				fs.mkdir('models', stuffit);
			}
		});

		function stuffit(err) {
			if(err) {
				console.log(' ** ERR:' + err);
				fun(err);
				return;
			}
			fs.writeFile(path, com.Model, genmod);
		}

		function genmod() {
			that.genModule(mod, save);
		}

		function save(err, pidapx) {
			if(err) {
				console.log(' ** ERR:' + err);
				fun(err);
				return;
			}
			Par.Inst.push(pidapx);
			console.log('..success');
			that.save(fun);
		}
	}

	//-----------------------------------------------------GetGraph
	function GetGraph(com, fun) {
		console.log('--World/GetGraph');
		var that = this;
		var Par = this.Par;
		com.Scene = Par.Pid;
		com.Graph = [];
		this.send(com, Par.Terrain, models);

		function models(err) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			async.eachSeries(Par.Inst, instance, done);
		}

		function instance(pidmod, func) {
			that.send(com, pidmod, func);
		}

		function done(err) {
			if(err) {
				console.log(' ** ERR:' + err);
				if(fun)
					fun(err);
				return;
			}
			fun(null, com);
		}
	}

	//-----------------------------------------------------GetModel
	// Retrieeve mode from instance module
	function GetModel(com, fun) {
		console.log('--World/GetModel');
		var that = this;
		var q = {};
		q.Cmd = 'GetModel';
		this.send(q, com.Instance, reply);

		function reply(err, q) {
			if('Model' in q) {
				com.Model = q.Model;
				fun(null, com);
			} else {
				fun('Model not available', com);
			}
		}
	}

	//-----------------------------------------------------SetPostion
	// Update scene graph from commands sent from models
	// to make sure that people that log in later get a
	// correct scene graph.
	function SetPosition(com, fun) {
		console.log('--SetPositoin');
		var Vlt = this.Vlt;
		var that = this;
		var graph = Vlt.Graph;
		trv(graph);

		function trv(inst) {
			for(let i=0; i<inst.length; i++) {
				var obj = inst[i];
				console.log('obj', obj.Instance, com.Instance);
				if(obj.Instance == com.Instance) {
					console.log('..found');
					if('Position' in com)
						obj.Position = com.Position;
					if('Axis' in com)
						obj.Axis = com.Axis;
					if('Angle' in com)
						obj.Angle = com.Angle;
					Relay.call(that, com, fun);
					return;
				}
				if('Inst' in obj)
					trv(obj.Inst);
			}
			console.log(' ** ERR:No tickee, no laundry');
			if(fun)
				fun();
		}
	}

	//-----------------------------------------------------Relay
	// Pass on to instances
	function Relay(com, fun) {
		console.log('--Relay', com.Cmd);
		var that = this;
		var Par = this.Par;
		if('Publish' in com) {
		//	console.log('Par.View', Par.View);
			that.send(com, Par.View);
			if(fun)
				fun(null, com);
			return;
		}
//		console.log('--World/Relay\n', JSON.stringify(com, null, 2));
		var pass = com.Passport;
		this.send(com, com.Instance, reply);

		//.................................................reply
		function reply(err, q) {
			if(err)
				fun(err);
			q.Passport = pass;
			fun(null, q);
		}
	}

})();

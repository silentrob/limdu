/**
 * A wrapper for the LibLinear package, by Fan, Chang, Hsieh, Wang and Lin.
 * 
 * To use this wrapper, the LibLinear executable (liblinear_train) should be in your path. 
 * 
 * You can download LibLinear here: http://www.csie.ntu.edu.tw/~cjlin/liblinear/
 * subject to the copyright license.
 *
 * @author Erel Segal-haLevi
 * @since 2013-09-09
 * 
 * @param opts options: <ul>
 *	<li>learn_args - a string with arguments for liblinear_train
 *  <li>model_file_prefix - prefix to path to model file (optional; the default is to create a temporary file in the system temp folder).
 *  <li>bias - constant (bias) factor (default: 1).
 *  <li>multiclass - if true, the 'classify' function returns an array [label,score]. If false (default), it returns only a score.
 */

function Boosting(opts) {
	/*if (!SvmLinear.isInstalled()) {
		var msg = "Cannot find the executable 'liblinear_train'. Please download it from the LibLinear website, and put a link to it in your path.";
		console.error(msg)
		throw new Error(msg); 
	}*/
	this.learn_args = opts.learn_args || "1000";
	this.model_file_prefix = opts.model_file_prefix || null;
	this.bias = opts.bias || 1.0;
	// this.multiclass = opts.multiclass || false;
	this.debug = opts.debug||false;
  	this.train_command = opts.train_command || 'tbb-train'
  	this.test_command = opts.test_command || 'tbb-predict'
  	this.timestamp = ""
}

Boosting.isInstalled = function() {
    try {
        var result = execSync("tbb-train");
        return true;
    } catch (err) {
        return false;
    }
};

var util  = require('util')
  , child_process = require('child_process')
  , exec = require('child_process').exec
  , fs   = require('fs')
  , svmcommon = require('../svm/svmcommon')
  , _ = require('underscore')._

var FIRST_FEATURE_NUMBER=1;  // in lib linear, feature numbers start with 1


Boosting.prototype = {
		trainOnline: function(features, expected) {
			throw new Error("Boosting does not support online training");
		},

		/**
		 * Send the given dataset to liblinear_train.
		 *
		 * @param dataset an array of samples of the form {input: [value1, value2, ...] , output: 0/1} 
		 */
		trainBatch: function(dataset) {
			this.timestamp = new Date().getTime()+"_"+process.pid

			// check for multilabel
			_.each(dataset, function(datum, key, list){
				if (_.isArray(datum.output))
					if (datum.output.length > 1)
						throw new Error("Multilabeling is not allowed");
            }, this)

            // filter out all "out of domain" istances
			console.log(process.pid+" DEBUGTRAIN: trainsize before filtering "+dataset.length)
			
			/*dataset = _.map(dataset, function(datum){
				if (_.isArray(datum.output))
					if (datum.output.length == 0)
						return undefined

				if (datum.output=="")
					return undefined					

				return datum
            }, this)*/

            dataset = _.compact(dataset)
			console.log(process.pid+" DEBUGTRAIN: trainsize after filtering "+dataset.length)

            //  convert all array-like outputs to just values
			dataset = _.map(dataset, function(datum){ 
				if (_.isArray(datum.output))
					datum.output = datum.output[0]
				return datum });            

			//console.log(process.pid+" DEBUGTRAIN: count output "+JSON.stringify(_.countBy(dataset, function(datum) { return datum.output }), null, 4))

			this.allLabels = _(dataset).map(function(datum){return datum.output});
			this.allLabels = _.flatten(this.allLabels)
		
			this.allLabelsCount = _.pairs(_.countBy(this.allLabels, function(num) { return num }))
			this.allLabelsCount = _.sortBy(this.allLabelsCount, function(num){ return num[1] }).reverse()

			console.log(process.pid+" DEBUGTRAIN: counts "+this.allLabelsCount)			
			console.log(process.pid+" DEBUGTRAIN: majority class "+this.allLabelsCount[0][0])
			
			this.allLabels = _.uniq(this.allLabels)

			console.log(process.pid+" DEBUGTRAIN: all possible labels "+this.allLabels)

			 dataset = _.map(dataset, function(datum){ 
				datum.output = this.allLabels.indexOf(datum.output)
				return datum }, this);

			if (this.allLabels.length==1) // a single label
				throw new Error(process.pid+" DEBUGTRAIN: single label")
				
			//console.log(util.inspect(dataset,{depth:1}));
			if (this.debug) console.log("trainBatch start");
			var learnFile = svmcommon.writeDatasetToFile(
					dataset, this.bias, /*binarize=*/false, this.model_file_prefix+"_"+this.timestamp, "SvmLinear", FIRST_FEATURE_NUMBER);
			var modelFile = learnFile.replace(/[.]learn/,".model");

			var command = this.train_command+" "+this.learn_args+" < "+learnFile + " > "+modelFile;
			console.log(process.pid+" DEBUGTRAIN: running "+command);

			var result = child_process.execSync(command);
			if (result.code>0)
				throw new Error("Failed to execute: "+command);

			this.modelFileString = modelFile;
			console.log(process.pid+"DEBUGTRAIN: set model file "+modelFile)

			if (this.debug) console.log("trainBatch end");
		},
		
		setModel: function(modelFileString) {
			// this.modelFileString = modelFileString;
			this.modelString = fs.readFileSync(modelFileString, "utf-8")
			this.mapLabelToMapFeatureToWeight = modelStringToModelMap(this.modelString);
			// this.allLabels = Object.keys(this.mapLabelToMapFeatureToWeight);
			if (this.debug) console.dir(this.mapLabelToMapFeatureToWeight);
		},
		
		getModelWeights: function() {
			return (this.multiclass? this.mapLabelToMapFeatureToWeight: this.mapLabelToMapFeatureToWeight[1]);
		},
	
		/**
		 * @param features - a feature-value hash.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @param continuous_output if true, return the net classification score. If false [default], return 0 or 1.
		 * @return the binary classification - 0 or 1.
		 */
		
/*		classifyBatch: function(trainset) {


			_.each(trainset, function(value, key, list){
				trainset[key].output = 0
			}, this)
			
			var testFile = svmcommon.writeDatasetToFile(
  */
//                          trainset, this.bias, /*binarize=*/false, "/tmp/test_"+this.timestamp, "SvmLinear", FIRST_FEATURE_NUMBER);

/*			var command = this.test_command+" "+testFile + " " + this.modelFileString + " /tmp/out_" + this.timestamp;
			var output = child_process.execSync(command)	
			console.log(command)
  			
			var result = fs.readFileSync("/tmp/out_" + this.timestamp, "utf-8").split("\n")
  			 			
			return result
		},
*/
		classify: function(features, explain, continuous_output) {

			var timestamp = new Date().getTime()+"_"+process.pid

			if (_.keys(features).length == 0)
				return {
					classes:this.allLabelsCount[0][0],
					classification:this.allLabelsCount[0][0]
					}

			if (!this.modelFileString)
				throw new Error("Boosting modelfilestring is undefined")
			
			var trainset = []
			trainset.push({
				'input': features,
				'output':999
			})

			var testFile = svmcommon.writeDatasetToFile(
                                        trainset, this.bias, /*binarize=*/false, "/tmp/test_"+timestamp, "SvmLinear", FIRST_FEATURE_NUMBER);

			var command = this.test_command + " " + this.modelFileString + " < " + testFile + " > " + " /tmp/out_" + timestamp;
 			
			var output = child_process.execSync(command)	
			console.log(process.pid+" DEBUGCLASSIFY: "+command)
  			
			var result = parseInt(fs.readFileSync("/tmp/out_" + timestamp, "utf-8").split("\n"))

			if (result == -1)
			{
				console.log(process.pid+" DEBUGCLASSIFY: NO CLASS")	
				return	{
					classes: [],
		 			classification: []
		 		}
			}
			
			console.log(process.pid+" DEBUGCLASSIFY: " + this.allLabels)
			console.log(process.pid+" DEBUGCLASSIFY: " +result+ " label "+this.allLabels[result])

//			return	{
//				classes: this.allLabels[result],
//		 		classification: this.allLabels[result]
//		 	}
		 	return (explain>0?
		 	 {
		 	    classes: this.allLabels[result],
		 	    classification: this.allLabels[result],
		 	    explanation: [],
		 	 }:
		 	    this.allLabels[result]);
		},

		/**
		 * Link to a FeatureLookupTable from a higher level in the hierarchy (typically from an EnhancedClassifier), used ONLY for generating meaningful explanations. 
		 */
		setFeatureLookupTable: function(featureLookupTable) {
			this.featureLookupTable = featureLookupTable;
		},
		
		toJSON: function() {
			return this.mapFeatureToWeight; 
		},
		
		fromJSON: function(json) {
			this.mapFeatureToWeight = json;  
		},
};


/*
 * UTILS
 */

var NEWLINE = require('os').EOL;

var LIB_LINEAR_MODEL_PATTERN = new RegExp(
		"[\\S\\s]*"+    // skip the beginning of string
		"^label (.*)"+NEWLINE+  // parse the label-list line
		"^nr_feature .*"+NEWLINE+  // parse the feature-count line (not used)
		"^bias (.*)"+NEWLINE+  // parse the bias line (not used - we use our own bias)
		"^w"+NEWLINE+                // start of weight matrix
		"([\\S\\s]*)" + // parse the weights
		"", "m");

var MIN_WEIGHT = 1e-5; // weights smaller than this are ignored, to save space

/**
 * A utility that converts a model in the SvmLinear format to a matrix of feature weights per label.
 * @param modelString a string.
 * @returns mapLabelToMapFeatureToWeight.
 */
function modelStringToModelMap(modelString) {
	var matches = LIB_LINEAR_MODEL_PATTERN.exec(modelString);
	if (!matches) {
		console.log(modelString);
		throw new Error("Model does not match SVM-Linear format");
	};
	var labels = matches[1].split(/\s+/);
	var mapLabelToMapFeatureToWeight = {};
	for (var iLabel in labels) {
		var label = labels[iLabel];
		mapLabelToMapFeatureToWeight[label]={};
	}

	var weightsMatrix = matches[3];
	// each line represents a feature; each column represents a label:
	
	var weightsLines = weightsMatrix.split(NEWLINE);
	for (var feature in weightsLines) {
		var weights = weightsLines[feature].split(/\s+/);
		weights.pop(); // ignore lal]st weight, which is empty (-space)
		if (weights.length==0)
			continue; // ignore empty lines
//		if (isNaN(parseFloat(weights[weights.length-1])))
//			weights.pop();
		if (weights.length==1 && labels.length==2)
			weights[1] = -weights[0];
		if (weights.length!=labels.length)
			throw new Error("Model does not match SVM-Linear format: there are "+labels.length+" labels ("+labels+") and "+weights.length+" weights ("+weights+")");
		for (var iLabel in labels) {
			var label = labels[iLabel];
			var weight = parseFloat(weights[iLabel]);
			if (Math.abs(weight)>=MIN_WEIGHT)
				mapLabelToMapFeatureToWeight[label][feature]=weight;
		}
	}

	return mapLabelToMapFeatureToWeight;
}



module.exports = Boosting;


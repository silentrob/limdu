/*
 * a unit-test for kNN classifier.
 * 
 * @author Vasily Konovalov
 * @since 2015-03
 */

var should = require('should');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');
var _ = require("underscore")._;

var unigramext = function(sentence, features) {
	var feature = sentence.split(" ")
	_.each(feature, function(feat, key, list){ features[feat] = 1 }, this)
	return features;
}

var kNNClassifier = classifiers.kNN.bind(this, {
    k: 1,
	distanceFunction: 'EuclideanDistance',
	/*EuclideanDistance
	EditDistance
	ChebyshevDistance
	ManhattanDistance*/

	distanceWeightening: '1/d'
	/*1/d - Weight by 1/d distance
	1-d - Weight by 1-d distance
	No - no distance weightening*/
});

var kNNClassifierE = classifiers.EnhancedClassifier.bind(this, {
	classifierType: kNNClassifier, 
	featureLookupTable: new ftrs.FeatureLookupTable()
});

var kNNClassifierEF = classifiers.EnhancedClassifier.bind(this, {
	classifierType: kNNClassifier, 
	featureLookupTable: new ftrs.FeatureLookupTable(),
	featureExtractor: unigramext
});

describe('kNN classifier', function() {

	it('enhance classification version', function(){

		var classifier = new kNNClassifierE();
		var trainSet = [
		        		{input: {a:0, b:0}, output: 0},
		        		{input: {a:1, b:1}, output: 0},
		        		{input: {a:0, b:1}, output: 1},
		        		{input: {a:1, b:2}, output: 1} ];

		classifier.trainBatch(trainSet);
		classifier.classify({a:0, b:0}).should.eql(-1);

	})

	it('enhance classification version', function(){

		var classifier = new kNNClassifierE();
		var trainSet = [
		        		{input: {a:1.5, d:1}, output: 0},
		        		{input: {a:1.2, d:0.6}, output: 0},
		        		{input: {a:2, d:1}, output: 1},
		        		{input: {a:2.5, d:2.1}, output: 1} ];

		classifier.trainBatch(trainSet);
		
		_.isEqual(classifier.featureLookupTable, { 
			featureIndexToFeatureName: [ undefined, 'a', 'd' ],
  			featureNameToFeatureIndex: { undefined: 0, a: 1, d: 2 } }).should.be.true

		classifier.classify({a:0, b:0, c:1})

		_.isEqual(classifier.featureLookupTable, {
		 	featureIndexToFeatureName: [ undefined, 'a', 'd', 'b', 'c' ],
  			featureNameToFeatureIndex: { undefined: 0, a: 1, d: 2, b: 3, c: 4 } }).should.be.true

	})

	it('enhance-feature classification version', function(){
		var classifier = new kNNClassifierEF();
		var trainSet = [
		        		{input: 'aa bb cc', output: 0},
		        		{input: 'bb aa cc', output: 0},
		        		{input: 'dd bb dd', output: 1},
		        		{input: 'dd pp ss', output: 1} ];

		classifier.trainBatch(trainSet);

/*		console.log(classifier.featureLookupTable)

		{ featureIndexToFeatureName: [ undefined, 'aa', 'bb', 'cc', 'dd', 'pp', 'ss' ],
  featureNameToFeatureIndex: { undefined: 0, aa: 1, bb: 2, cc: 3, dd: 4, pp: 5, ss: 6 } }
*/
	})

})

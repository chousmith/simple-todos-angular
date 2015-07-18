/**
 * todos-angular Meteor app
 * originally based off the https://www.meteor.com/tutorials/angular/creating-an-app
 *
 * v1.0.1
 */

Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
	// only runs on client side
	angular.module("todos", ['angular-meteor', 'angularMoment']);

	angular.module("todos").controller("TodosListCtrl", ['$scope', '$window', '$meteor',
	function ( $scope, $window, $meteor ) {
    $scope.$meteorSubscribe("tasks");
    
    /*
    $scope.tasks = [
      { text: "This is task 1" },
      { text: "This task 2" },
      { text: "Task 3 is here" },
    ];
    */
    
    $scope.$watch('hideCompleted', function() {
      if ($scope.hideCompleted)
        $scope.query = {checked: {$ne: true}};
      else
        $scope.query = {};
    });
    
    $scope.tasks = $meteor.collection(function() {
      // actually here just sort tasks by newest first
      return Tasks.find( $scope.getReactively('query'), { sort: { createdAt: -1 } })
    });
    
    $scope.addTask = function(newTask) {
      $meteor.call("addTask", newTask);
    };
    
    $scope.deleteTask = function(task) {
      $meteor.call("deleteTask", task._id);
    };
    
    $scope.setChecked = function(task) {
      $meteor.call("setChecked", task._id, !task.checked);
    };
    
    // Add a setPrivate scope function
    $scope.setPrivate = function(task) {
      $meteor.call("setPrivate", task._id, ! task.private);
    };
    
    // Add to scope
    $scope.incompleteCount = function () {
      return Tasks.find({ checked: {$ne: true} }).count();
    };
    
    // a little moment.js fromNow formatting cleanup
    $window.moment.locale('en', {
      relativeTime : {
        future: 'in %s',
        past: '%s ago',
        s: '%ds',
        m: '1m',
        mm: '%dm',
        h: '1h',
        hh: '%dh',
        d: '1d',
        dd: '%dd',
        M: '1 month',
        MM: '%d months',
        y: '1 year',
        yy: '%d years'
      }
    });
	}]);
  
  // At the bottom of the client code
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

Meteor.methods({
  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
    
    console.log('new Task : '+ Meteor.user().username +' : '+ text );
  },
  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can delete it
      throw new Meteor.Error("not-authorized");
    } // else
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    console.log( ( setChecked ? '' : 'un-' ) + 'completed task '+ taskId );
    var task = Tasks.findOne(taskId);
    if (task.private && task.owner !== Meteor.userId()) {
      // If the task is private, make sure only the owner can check it off
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: { checked: setChecked} });
  },
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);

    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });
}

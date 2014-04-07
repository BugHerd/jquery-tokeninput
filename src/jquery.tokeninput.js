

// Task Create View
ns("BugHerd.Shared.Views.Task.Create", Backbone.View.extend({
  template: "#taskcreate-template",
  tagName: "div",
  className: "taskCreate",
  dragging: null,
  memberList: null,
  tagsList: null,

  events: {
    "click .button-feedback": "submit",
    "click .button-task": "submit",
    "click .button-admin": "submit",
    "click .submitTask": "start",
    "click .entry-close": "finish",
    "click .stopTasks": "finish",
    "click .button-close": "finish",
    "click .extension-message": "openUrl"
  },

  initialize: function (options) {
    // Defaults
    this.options = _.extend({},this.options||{},options);

    // Template
    this.template = _.template($(this.template).html());

    // Bindings
    _.bindAll(this, "render", "start",  "submit", "hotkey", "finish", "openUrl");
  },

  getActivePane: function() {
    return this.$('.createBlock.active,.confirmBlock.active');
  },

  hotkey: function(event) {
    // Prepare
    var $pane, $selected;

    // Handle
    switch ( true ) {

      case BugHerd.Util.browserSubmitShortcutKey(event) /* cmd+enter */:
      this.submit();
      event.preventDefault();
      break;

      case event.which === 27 /* escape */:
      this.finish(event);
      event.preventDefault();
      break;

      case event.which === 13 /* enter */:
      $pane = this.getActivePane();
      if ( $pane.is('.confirmBlock') ) {
        this.finish(event);
      }
      else {
        $selected = $pane.find('.hover');
        if ( $selected.length ) {
          $selected.trigger('click');
          event.preventDefault();
        }
      }
      break;

      case event.which === 38 /* up */:
      $pane = this.getActivePane();
      $selected = $pane.find('li.hover');
      if ( !$selected.length ) {
        $selected = $pane.find('li.active');
      }
      if ( !$selected.length ) {
        $selected = $pane.find('li:last').click();
        if ( $selected.length ) {
          event.preventDefault();
        }
      }
      else if ( $selected.length ) {
        if ( $selected.prev().length ) {
          $selected.removeClass('hover').prev().click();
        }
        else {
          $pane.find('li:last').click();
        }
        event.preventDefault();
      }
      break;

      case event.which === 40 /* down */:
      $pane = this.getActivePane();
      $selected = $pane.find('li.hover');
      if ( !$selected.length ) {
        $selected = $pane.find('li.active');
      }
      if ( !$selected.length ) {
        $selected = $pane.find('li:first').click();
        if ( $selected.length ) {
          event.preventDefault();
        }
      }
      else if ( $selected.length ) {
        if ( $selected.next().length ) {
          $selected.removeClass('hover').next().click();
        }
        else {
          $selected.removeClass('hover');
          $pane.find('li:first').click();
        }
        event.preventDefault();
      }
      break;
    }
  },

  createTask: function(data,options) {
    var task = new BugHerd.Shared.Models.Task(data,options);
    this.setTask(task);
    return task;
  },

  setTask: function(task) {
    this.options.task = task;
    return this;
  },

  getTask: function() {
    return this.options.task;
  },

  resetTask: function() {
    var task = this.getTask();
    if ( task ) {
      if ( task.isNew() ) {
        task.destroy();
      }
      this.setTask(null);
    }
    return this;
  },

  initializeInputs: function() {
    var
    descriptionValid = false,
    validEmailRequired = ((bugherd.application.get('mode') == 'anonymous') && bugherd.getConfigOption('reporter','required')),
    emailValid;

    var
    $assignee = this.$('#bh-assignee'),
    $reporter = this.$('#bh-reporter'),
    $tags = this.$('#bh-tags'),
    $description = this.$('#bh-description'),
    $actions = this.$('.entry-actions').children();
    this.$("ul").remove();

    this.memberList = new BugHerd.Shared.Collections.User(_.filter(bugherd.application.usersCollection.models, function (a){
      return a.get("is_member") === true;
    }));

    var validEmail = function(email) {
      if (validEmailRequired) {
        return (/([\w\.%\+\-]+)@([\w\-]+\.)+([\w]{2,})/i).test(email);
      } else {
        return true;
      }
    };

    if (validEmailRequired) {
      // Feedback email required
      emailValid = validEmail($reporter.val());
    } else {
      emailValid = true;
    }

    var showValidity = function() {
      $actions
      .toggleClass('disabled',!(descriptionValid && emailValid))
      .prop('disabled',!(descriptionValid && emailValid));
    };
    if (validEmailRequired) {
      $reporter.countText({
        callback: function(isValid) {
          emailValid = isValid && validEmail($reporter.val());
          showValidity();
        }
      });
    }
    $description.countText({
      maxLength: 1000,
      callback: function(isValid) {
        descriptionValid = isValid;
        showValidity();
      }
    });

  },

  render: function() {
    // Prepare
    var
    me = this,
    users = bugherd.application.usersCollection;

    var bhReporter = localStorage.getItem('bh-reporter') || "";

    // Bring the element to the top
//    this.$el.topZIndex();

    // Render the element
    this.$el.html(this.template({
      users: users.toJSON(),
      bhReporter: bhReporter
    }));

    // Fetch
    var
    $assigneeListItems = this.$(".taskCreateAssignee"),
    $assigneeSearch = this.$(".taskCreateAssigneeSearch");

    // Render Search
    $assigneeSearch.quicksearch($assigneeListItems,{
      selector: '.assigneeName'
    });

    // Loading Spinner
    var $loadingIcon = this.$(".confirm-loading .confirm-icon");
    var opts = {
      lines: 11, // The number of lines to draw
      length: 4, // The length of each line
      width: 3, // The line thickness
      radius: 4, // The radius of the inner circle
      rotate: 0, // The rotation offset
      color: '#fff', // #rgb or #rrggbb
      speed: 1, // Rounds per second
      trail: 30, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 200, // The z-index (defaults to 2000000000)
      top: 11, // Top position relative to parent in px
      left: 11 // Left position relative to parent in px
    };
    var spinner = new Spinner(opts).spin($loadingIcon[0]);

    this.initializeInputs();

    this.$fader = this.$fader || $("<div class=\"bhAdminFader\" />").css({
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      position: "fixed",
      background: "#1d313a",
      opacity: ".7",
      cursor: "crosshair",
      zIndex: "199"
    }).hide().appendTo('body');

    // Chain
    return this;
  },
  openUrl: function(details) {
    bugherd.openUrl(bugherd.getExtensionLink());
  },
  receiveExtensionExistance: function(details){
    // Prepare
    var $message;
    // TODO: this does not work ether.
    $message = this.$('.extension-message');
    // Do not show the message if our browser is not supported
    if ( details === null )  {
      $message.hide();
    } else {
      // A newer version of the extension exists
      if ( !details || !details.response || details.response.version != 1 ) {
        $message.show();
      }
      // We have the extension and it is up to date
      else {
        $message.hide();
      }
    }

    // Chain
    return this;
  },


  show: function() {
    var self = this;

    this.$fader.css('opacity', '.7').show();
    // Position
    this.$el.css({
      position: 'absolute'
    });

    // Reset
    this.dragging = null;

    // Show
    this.$el.show();

    if( bugherd.application.get('location') !== 'admin') {
      bugherd.requestExtensionExistance({},this.receiveExtensionExistance);
    }

    // TODO: this is a hack for now, need to fix this
    $(".token-input-dropdown-bh").remove();

    var $assignee = $("<input>").attr({id:"bh-assignee",type:"text"}).appendTo( this.$('.assigneeHolder').empty());
    var assigneeInput = $assignee.tokenInput(this.memberList.toJSON(), {
      theme             :   'bh',
      tokenLimit        :   1,
      animateDropdown   :   false,
      allowFreeTagging  :   false,
      allowTabOut       :   true,
      noResultsText     :   "No developers found."
    });


    var $tags = $("<input>").attr({id: "bh-tags", type: "text"}).appendTo( self.$('.tagHolder').empty());

    var tagsInput = $tags.tokenInput(bugherd.application.tasksCollection.updateTagsCollection().tagsCollection.toJSON(), {
      theme             :   'bh',
      preventDuplicates :   true,
      animateDropdown   :   false,
      allowFreeTagging  :   true,
      allowTabOut       :   true,
      noResultsText     :   "No results. Type comma to add.",
      alphaSort         :   true,
      createNew         :   true,
      createNewSuffix   :   " (new tag)"
    });

    // Hotkeys
    $(document).off('keydown',this.hotkey).on('keydown',this.hotkey);
    $("label.inline").inFieldLabels();

    // Chain
    return this;
  },

  /**
   * exit bug creation mode
   * @param  {event} e click event on cancel button
   */
   hide: function() {
    // Hide
    this.$el.hide();
    if(this.$fader){
     this.$fader.hide();
   }

    // Reset
    this.dragging = null;

    // Hotkeys
    $(document).off('keydown',this.hotkey);

    // Chain
    return this;
  },

  visible: function() {
    return this.$el.is(':visible');
  },

  start: function($target) {

    // Prepare
    var
    me = this,
    $description = this.$("#bh-description"),
    $reporterEmail = this.$("#bh-reporter"),
    $reportToEmail = this.$("#bh-report-to"),
    $priority = this.$("#bh-severity").val(0),
    $assigned = this.$("#bh-assignee"),
    $tags = this.$("#bh-tags"),
    tasks = bugherd.application.tasksCollection;

    this.$(".bh-entry").removeClass("entry-success").removeClass("entry-error");
    this.$(".confirm-message").hide();
    this.$(".entry-content, .entry-actions").show();

    // Reset the old task
    this.resetTask();

    // Clear values
    $description.val('').trigger('change');
    if ($priority.length > 0) $priority.val(0);

    // Create our task mode
    var task;

    if(bugherd.application.get('location') === 'admin'){
      task = this.createTask({
        url: null,
        selector_info: null,
        browser_info: null,
        data: null
      });
    }
    else
    {
      var selectorData = this.prepareTagInfo($target);

      // Add our coordinates
      var data = {};
      var coordinates = this.generateCoordinates($target);
      data.coordinates = coordinates;

      // Add our user meta data
      var userMetaData = bugherd.getConfigOption("metadata") || {};
      data.userMetaData = userMetaData;

      task = this.createTask({
        url: bugherd.getParentPath(),
        selector_info:selectorData,
        site: bugherd.getParentHost(),
        browser_info: BugHerd.Util.getBrowserSpecs(),
        data: data
      });
    }


    // Chain
    this.show();
    $description.focus();
    return this;
  },

  prepareTagInfo: function (target) {
    // Prepare
    var $parentDocument = bugherd.parentPage.$document;
    var t = 50;
    var nodes = {};

    // If there is no target, don't do anything
    if ( !target || target.get(0) === $parentDocument.get(0) ) {
      // nothing
    }

    // If the target is something else, do some stuff
    else {
      //get simple selector
      var path = this.getSelector(target);
      target.removeClass("bugherd_highlight").filter('[class=""]').removeAttr('class');
      var outerhtml = target.outerHTML().substring(0,500);
      nodes.path = path;
      nodes.html = outerhtml;
      nodes.version = 2;
      nodes.data = {
        bugOffsetX: target.data("bugOffsetX")/target.width(),
        bugOffsetY: target.data("bugOffsetY")/target.height()
      };
    }

    return nodes;
  },

  /**
   * generate a CSS selector
   * @param  {dom element} el       the element to get info about
   * @param  {string} selector the selector we've made so fat
   * @return {string}
   */
   getSelector: function($el, selector) {
    selector = selector || "";

    if ( $el.is("html") ) {
      return "html" + selector;
    }

    var id = $el.attr("id");
    var className = ($el.attr("class")||'').replace(/([.#>])/g,'\\\\$1').split(/[\s\n]+/).join(".");
    var tag = $el.get(0).nodeName.toLowerCase();

    if ( id ) {
      tag += "#" + id;
    }

    if ( className ) {
      tag += "." + className;
    }

    tag = tag.replace(".bugherd_highlight","");

    return this.getSelector($el.parent(), ">" + tag + selector);
  },

  generateCoordinates: function($target) {
    // Prepare
    var
    parentPageOffset = bugherd.config.parentPageOffset,
    $parentWindow = bugherd.parentPage.$window,
    $parentDocument = bugherd.parentPage.$document,
    $parentBody = bugherd.parentPage.$body,
    targetOffset = $target.offset() || {top:0,left:0},
    coordinates = {
      pageOffsetLeft: parentPageOffset.left,
      pageOffsetTop: parentPageOffset.top,
      pageWidth: $parentDocument.width(),
      pageHeight: $parentDocument.height(),
      bodyWidth: $parentBody.width(),
      bodyHeight: $parentBody.height(),
      windowWidth: $parentWindow.prop('innerWidth'),
      windowHeight: $parentWindow.prop('innerHeight'),
      scrollX: $parentWindow.prop('scrollX'),
      scrollY: $parentWindow.prop('scrollY'),
      flagX: null,
      flagY: null,
      flagRelativeX: $target.data('bugOffsetX') || 0,
      flagRelativeY: $target.data('bugOffsetY') || 0,
      targetX: targetOffset.left,
      targetY: targetOffset.top,
      targetWidth: $target.width(),
      targetHeight: $target.height(),
      screenshotWindowX: null,
      screenshotWindowY: null,
      screenshotWindowWidth: null,
      screenshotWindowHeight: null,
      screenshotWindowFlagX: null,
      screenshotWindowFlagY: null,
      screenshotTargetX: null,
      screenshotTargetY: null,
      screenshotTargetWidth: 319,
      screenshotTargetHeight: 200,
      screenshotTargetFlagX: null,
      screenshotTargetFlagY: null
    };

    // Flag
    coordinates.flagX = coordinates.targetX + coordinates.flagRelativeX;
    coordinates.flagY = coordinates.targetY + coordinates.flagRelativeY;

    // Screenshot Window
    coordinates.screenshotWindowX = coordinates.scrollX;
    coordinates.screenshotWindowY = coordinates.scrollY;
    coordinates.screenshotWindowFlagX = coordinates.flagX - coordinates.screenshotWindowX;
    coordinates.screenshotWindowFlagY = coordinates.flagY - coordinates.screenshotWindowY;

    // Make Screenshot Window size adjust to only the size we need to
    coordinates.screenshotWindowWidth = coordinates.windowWidth; /*Math.max(
      Math.min(coordinates.windowWidth,coordinates.bodyWidth),
      coordinates.screenshotWindowFlagX
      );*/
    coordinates.screenshotWindowHeight = coordinates.windowHeight; /*Math.max(
      Math.min(coordinates.windowHeight,coordinates.bodyHeight),
      coordinates.screenshotWindowFlagY
      );*/

    // Screenshot Target
    var screenshotTargetPosition = this.generatePosition(
                                                         coordinates,
                                                         coordinates.screenshotTargetWidth,
                                                         coordinates.screenshotTargetHeight,
                                                         0,
                                                         'screenshot'
                                                         );
    coordinates.screenshotTargetX = screenshotTargetPosition.x;
    coordinates.screenshotTargetY = screenshotTargetPosition.y;
    coordinates.screenshotTargetFlagX = coordinates.flagX - coordinates.screenshotTargetX;
    coordinates.screenshotTargetFlagY = coordinates.flagY - coordinates.screenshotTargetY;

    // Return
    return coordinates;
  },


  generatePosition: function(coordinates,width,height,padding,mode) {
    // Prepare
    var
    parentWindow = bugherd.parentPage.window,
    x = coordinates.flagX,
    y = coordinates.flagY,
    maxWidth, maxHeight;

    // Mode
    if ( mode === 'screenshot' ) {
      // set maxes
      maxWidth = coordinates.pageWidth;
      maxHeight = coordinates.pageHeight;
      // center
      x -= width/2;
      y -= height/2;
    }
    else {
      // set maxes
      maxWidth = coordinates.windowWidth;
      maxHeight = coordinates.windowHeight;
      // take scrolling into account
      x -= parentWindow.scrollX;
      y -= parentWindow.scrollY;
      // center optional
      if ( mode === 'center' ) {
        x -= width/2;
        y -= height/2;
      }
    }

    // Adjust Left
    if ( x+width+padding > maxWidth ) {
      x = maxWidth-width-padding;
    }
    if ( x < padding ) {
      x = padding;
    }

    // Adjust Top
    if ( y+height+padding > maxHeight ) {
      y = maxHeight-height-padding;
    }
    if ( y < padding ) {
      y = padding;
    }

    // Return
    return {
      x: x,
      y: y
    };
  },



  finish: function(event) {

    // Reset the task
    this.resetTask();
    // Hide
    this.$(".confirmBlock.active").removeClass("active");
    this.hide();

    // Event
    if (event && $(event.target).hasClass('cancelLink')) {
      this.trigger('cancelTagging');
    }
    this.trigger('endTagging');

    if ((bugherd.isExtension && bugherd.application.get('mode') == 'anonymous')) {

      bugherd.emitEvent('removeBugherd',{});
    }
    // Chain
    return this;
  },

  /**
   * create new task and save to server, end bug tag mode
   */
   submit: function() {

    // Prepare
    var taskCreate,
    task = this.getTask(),
    self = this;

    if(!bugherd.application.isAdminView() && !bugherd.application.get('screenshotDisabled')) {
      this.token = bugherd.setupScreenshot();
    }
    // Setup Values
    var $description = this.$('#bh-description').val(),
    $reporter = this.$("#bh-reporter").val(),
    $reportTo = this.$("#bh-report-to").val(),
    $severity = this.$('#bh-severity').val(),
    $assignee = this.$("#bh-assignee").val(),
    $created = new XDate().toISOString(),
    $tags = $("#bh-tags").val() ? $("#bh-tags").val().split(',') : null,
    $status = 0;

    // Store the email address of the reporter...
    if ($reporter) localStorage.setItem('bh-reporter',$reporter);

    // Update
    task.set({
      description: $description,
      requester_email: $reporter,
      report_to: $reportTo,
      priority_id: $severity,
      assigned_to_id: $assignee,
      created_at: $created,
      tag_names: $tags || [],
      status_id: $status
    });
    window.onbeforeunload = function(e) {
      var msg = "A task is still being created.";
      // IE, gecko and webkit all do this different
      (e || window.event).returnValue = msg;
      return msg;
    };
    this.showLoading();
    bugherd.application.tasksCollection.create(task, {
      success:function(){
        task.collection.trigger('reset');
        if(!bugherd.application.isAdminView()){
          self.showSuccess();
        }
        else {
          self.finish();
        }
        window.onbeforeunload = null;
      },
      error:function(model, xhr, textStatus, errorThrown){
        bugherd.application.setupRaven(function(raven) {
          // I know it seems like a lot of the same error message
          // but actually jquery is a bit funny...
          raven.captureMessage('Create task error: ' + xhr.statusText + '\n' + JSON.stringify(textStatus) + '\n' + errorThrown + '\n' + xhr.status + '\n' + JSON.stringify(model.toJSON()) + '\n\n' + xhr.responseText);
        });

        var errorMessage;
        if ( _.isObject(xhr.responseText) && _.isString(xhr.responseText.error) ) {
          errorMessage = xhr.responseText.error;
        } else {
          // we need to handle empty reponse text for when the network is offline or CORS issues
          if (xhr.responseText !== "") {
            errorMessage = JSON.parse(xhr.responseText).error;
          } else {
            errorMessage = "Could not connect to our servers, please check your network configuration";
          }
        }
        self.showError(errorMessage);
        window.onbeforeunload = null;
      }
    });

    // Chain
    return this;
  },

  // Loading Pane
  showLoading: function(e) {
    this.$(".entry-content, .entry-actions, .confirm-message").hide();
    this.$(".confirm-loading").show();

    // Chain
    return this;
  },

  // Error Pane
  showError: function(errorMessage) {
    this.$(".bh-entry").removeClass("entry-success").addClass("entry-error");
    this.$(".entry-content, .entry-actions, .confirm-message").hide();
    this.$(".confirm-error").show();
    if (errorMessage) {
      this.$(".confirm-error")
        .find('p')
        .text(errorMessage);
    }
    // Chain
    return this;
  },

  // Success Pane

  showSuccess: function(e) {
    var task = this.getTask();

    if(!bugherd.application.get('screenshotDisabled')) {
      bugherd.requestScreenshot({
        taskID: task.id,
        token: this.token,
        taskCoordinates: task.getCoordinates(),
        checkRelevanceCallback: function(details){
          // check if we are still the same task, and that we are still on the success pane
          return task.id === details.request.taskID && this.$(".confirmBlock .success").is(':visible') === true;
        }
      });
    }

    if (bugherd.application.get('mode') == 'anonymous') {

      this.$(".bh-entry").removeClass("entry-error").addClass("entry-success");
      this.$(".entry-content, .entry-actions, .confirm-message").hide();

      if(bugherd.isExtension){
        var url = this.getTask().get('secret_link');
        this.$(".confirm-success")
        .addClass('confirm-extension')
        .find('p')
        .find('a')
        .empty()
        .end()
        .append('<a href="' + url + '" target=_blank>' + url + '</a>');
      }
      this.$(".confirm-success").show();
    }
    else
    {
      this.finish();
    }

    // Chain
    return this;
  }

}));

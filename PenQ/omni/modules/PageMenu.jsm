
let EXPORTED_SYMBOLS = ["PageMenu"];

function PageMenu() {
}

PageMenu.prototype = {
  PAGEMENU_ATTR: "pagemenu",
  GENERATEDITEMID_ATTR: "generateditemid",

  popup: null,
  builder: null,

  maybeBuildAndAttachMenu: function(aTarget, aPopup) {
    var pageMenu = null;
    var target = aTarget;
    while (target) {
      var contextMenu = target.contextMenu;
      if (contextMenu) {
        pageMenu = contextMenu;
        break;
      }
      target = target.parentNode;
    }

    if (!pageMenu) {
      return false;
    }

    var insertionPoint = this.getInsertionPoint(aPopup);
    if (!insertionPoint) {
      return false;
    }

    pageMenu.QueryInterface(Components.interfaces.nsIHTMLMenu);
    pageMenu.sendShowEvent();
    // the show event is not cancelable, so no need to check a result here

    var fragment = aPopup.ownerDocument.createDocumentFragment();

    var builder = pageMenu.createBuilder();
    if (!builder) {
      return false;
    }
    builder.QueryInterface(Components.interfaces.nsIXULContextMenuBuilder);
    builder.init(fragment, this.GENERATEDITEMID_ATTR);

    pageMenu.build(builder);

    var pos = insertionPoint.getAttribute(this.PAGEMENU_ATTR);
    if (pos == "start") {
      insertionPoint.insertBefore(fragment,
                                  insertionPoint.firstChild);
    } else {
      insertionPoint.appendChild(fragment);
    }

    this.builder = builder;
    this.popup = aPopup;

    this.popup.addEventListener("command", this);
    this.popup.addEventListener("popuphidden", this);

    return true;
  },

  handleEvent: function(event) {
    var type = event.type;
    var target = event.target;
    if (type == "command" && target.hasAttribute(this.GENERATEDITEMID_ATTR)) {
      this.builder.click(target.getAttribute(this.GENERATEDITEMID_ATTR));
    } else if (type == "popuphidden" && this.popup == target) {
      this.removeGeneratedContent(this.popup);

      this.popup.removeEventListener("popuphidden", this);
      this.popup.removeEventListener("command", this);

      this.popup = null;
      this.builder = null;
    }
  },

  getImmediateChild: function(element, tag) {
    var child = element.firstChild;
    while (child) {
      if (child.localName == tag) {
        return child;
      }
      child = child.nextSibling;
    }
    return null;
  },

  getInsertionPoint: function(aPopup) {
    if (aPopup.hasAttribute(this.PAGEMENU_ATTR))
      return aPopup;

    var element = aPopup.firstChild;
    while (element) {
      if (element.localName == "menu") {
        var popup = this.getImmediateChild(element, "menupopup");
        if (popup) {
          var result = this.getInsertionPoint(popup);
          if (result) {
            return result;
          }
        }
      }
      element = element.nextSibling;
    }

    return null;
  },

  removeGeneratedContent: function(aPopup) {
    var ungenerated = [];
    ungenerated.push(aPopup);

    var count;
    while (0 != (count = ungenerated.length)) {
      var last = count - 1;
      var element = ungenerated[last];
      ungenerated.splice(last, 1);

      var i = element.childNodes.length;
      while (i-- > 0) {
        var child = element.childNodes[i];
        if (!child.hasAttribute(this.GENERATEDITEMID_ATTR)) {
          ungenerated.push(child);
          continue;
        }
        element.removeChild(child);
      }
    }
  }
}

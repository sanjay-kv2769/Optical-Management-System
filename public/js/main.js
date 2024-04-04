(function () {
  'use strict';

  var treeviewMenu = $('.app-menu');
  var appContainer = $('.app');

  // Collapse Sidebar Initially
  appContainer.addClass('sidenav-toggled');

  // Toggle Sidebar
  $('[data-toggle="sidebar"]').click(function (event) {
    event.preventDefault();
    appContainer.toggleClass('sidenav-toggled');
  });

  // Activate sidebar treeview toggle
  $("[data-toggle='treeview']").click(function (event) {
    event.preventDefault();
    if (!$(this).parent().hasClass('is-expanded')) {
      treeviewMenu
        .find("[data-toggle='treeview']")
        .parent()
        .removeClass('is-expanded');
    }
    $(this).parent().toggleClass('is-expanded');
  });
})();

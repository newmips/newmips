$(function() {
  // $( "#sortable" ).sortable();
  // $( "#test_menu_item" ).droppable({
  //     drop: function( event, ui ) {
  //       var parameters = { dragged_item: ui.draggable.data('identifiant'), dropped_item: $(this).data('identifiant') };
  //       $.get( '/sort_menu', parameters, function(data) {});
  //
  //     }
  //   });
  // $( "#adresse_menu_item" ).droppable({
  //     drop: function( event, ui ) {
  //       var parameters = { dragged_item: ui.draggable.data('identifiant'), dropped_item: $(this).data('identifiant') };
  //       $.get( '/sort_menu', parameters, function(data) {});
  //     }
  //   });
  // $( "#personne_menu_item" ).droppable({
  //     drop: function( event, ui ) {
  //       var parameters = { dragged_item: ui.draggable.data('identifiant'), dropped_item: $(this).data('identifiant') };
  //       $.get( '/sort_menu', parameters, function(data) {});
  //     }
  //   });
  // $('#test_menu_item').data( 'identifiant', 'test_menu_item' );
  // $('#adresse_menu_item').data( 'identifiant', 'adresse_menu_item' );
  // $('#personne_menu_item').data( 'identifiant', 'personne_menu_item' );

  $( "#sortable" ).sortable();

  $( "li.treeview" ).each( function( index, element ){

    var elem = $( element );
    elem.droppable({
        drop: function( event, ui ) {
          var parameters = { dragged_item: ui.draggable.data('identifiant'), dropped_item: elem.data('identifiant') };
          $.get( '/sort_menu', parameters, function(data) {});

        }

    });

    elem.data( 'identifiant', elem.attr('id'));


  });
});

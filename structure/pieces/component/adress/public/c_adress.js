$(document).ready(function () {
    var c_adress_search_config = $('#c_adress_search_config').val();
    if (!!c_adress_search_config) {
        try {
            c_adress_search_config = JSON.parse(c_adress_search_config);
        } catch (e) {
        }
    }
    if (typeof c_adress_search_config !== 'undefined') {
        if (c_adress_search_config.enable) {
            $('#c_adress_search').each(function () {
                var result;
                var fieldsToShow = c_adress_search_config.autocomplete_field.split(',');
                $(this).autocomplete({
                    minLength: 2,
                    source: function (req, res) {
                        var val = $('#c_adress_search').val();
                        var data = {limit: 10};
                        data[c_adress_search_config.query_parm] = val;
                        $.ajax({
                            url: c_adress_search_config.url,
                            type: c_adress_search_config.type,
                            data: data,
                            dataType: 'json',
                            success: function (data) {
                                result = c_adress_search_config.arraydata !== '.' ? data[c_adress_search_config.arraydata] : data;
                                res($.map(result, function (_adress) {
                                    var objet = c_adress_search_config.whereisdata !== '.' ? _adress[c_adress_search_config.whereisdata] : _adress;
                                    var toReturn = '';
                                    fieldsToShow.forEach(function (field) {
                                        toReturn += objet[field] + ' ';
                                    });
                                    return toReturn;
                                }));
                            }
                        });
                    },
                    select: function (e, ui) {
                        result.forEach(function (_adress) {
                            var toReturn = '';
                            _adress = c_adress_search_config.whereisdata !== '.' ? _adress[c_adress_search_config.whereisdata] : _adress;
                            var toReturn = '';
                            fieldsToShow.forEach(function (field) {
                                toReturn += _adress[field] + ' ';
                            });
                            if (ui.item.value == toReturn) {
                                for (var key in _adress) {
                                    $('#f_' + key).val(_adress[key]);
                                }
                            }
                        });
                    }
                });
            });
        }
    }

});
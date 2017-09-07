$(document).ready(function () {
    var c_address_search_config = $('#c_address_search_config').val();
    if (!!c_address_search_config) {
        try {
            c_address_search_config = JSON.parse(c_address_search_config);
        } catch (e) {
        }
    }
    if (typeof c_address_search_config !== 'undefined') {
        if (c_address_search_config.enable) {
            $('#c_address_search').each(function () {
                var result;
                var fieldsToShow = c_address_search_config.autocomplete_field.split(',');
                $(this).autocomplete({
                    minLength: 2,
                    source: function (req, res) {
                        var val = $('#c_address_search').val();
                        var data = {limit: 10};
                        data[c_address_search_config.query_parm] = val;
                        $.ajax({
                            url: c_address_search_config.url,
                            type: c_address_search_config.type,
                            data: data,
                            dataType: 'json',
                            success: function (data) {
                                result = c_address_search_config.arraydata !== '.' ? data[c_address_search_config.arraydata] : data;
                                res($.map(result, function (_address) {
                                    var objet = c_address_search_config.whereisdata !== '.' ? _address[c_address_search_config.whereisdata] : _address;
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
                        result.forEach(function (_address) {
                            var toReturn = '';
                            _address = c_address_search_config.whereisdata !== '.' ? _address[c_address_search_config.whereisdata] : _address;
                            var toReturn = '';
                            fieldsToShow.forEach(function (field) {
                                toReturn += _address[field] + ' ';
                            });
                            if (ui.item.value == toReturn) {
                                for (var key in _address) {
                                    if (_address[key] != '') //to prevent to replace default value
                                        $('#f_' + key).val((_address[key] + '').toUpperCase());
                                }
                            }
                        });
                    }
                });
            });
        }
    }

});
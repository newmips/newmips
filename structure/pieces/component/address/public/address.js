$(document).ready(function () {
    var address_search_config = $('#address_search_config').val();
    if (!!address_search_config) {
        try {
            address_search_config = JSON.parse(address_search_config);
        } catch (e) {
            address_search_config = undefined;
        }
    }
    if (typeof address_search_config !== 'undefined') {
        if (address_search_config.enable) {
            $('#address_search').each(function () {
                var result;
                var fieldsToShow = address_search_config.autocomplete_field.split(',');
                $(this).autocomplete({
                    minLength: 2,
                    source: function (req, res) {
                        var val = $('#address_search').val();
                        var data = {limit: 10};
                        data[address_search_config.query_parm] = val;
                        $.ajax({
                            url: address_search_config.url,
                            type: address_search_config.type,
                            data: data,
                            dataType: 'json',
                            success: function (data) {
                                result = address_search_config.arraydata !== '.' ? data[address_search_config.arraydata] : data;
                                res($.map(result, function (_address) {
                                    var objet = address_search_config.whereisdata !== '.' ? _address[address_search_config.whereisdata] : _address;
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
                            _address = address_search_config.whereisdata !== '.' ? _address[address_search_config.whereisdata] : _address;
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
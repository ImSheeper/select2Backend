class ESel {
    dynamicSel(selectOptions, queryParameters = []) {
        const selectClass = selectOptions.selectClass;
        const queryId = selectOptions.queryId;
        const delay = selectOptions.delay ?? 250;
        const limit = selectOptions.limit ?? 100;

        // Sorka, ale nie wiem jak to w utilsach ogarnąć. Zrobić do tego osobną metodę? Ma to sens?
        if (!selectClass || !queryId) {
            console.error('Wprowadzono niepoprawną strukturę obiektu selectOptions. Poprawna struktura {selectClass, queryId}');
            return;
        }

        if (typeof selectClass !== 'string') {
            console.error(`Wprowadzono niepoprawny typ argumentu selectClass. Spodziewany argument 'string', wprowadzony '${typeof selectClass}'`);
            return;
        }

        if (typeof queryId !== 'string') {
            console.error(`Wprowadzono niepoprawny typ argumentu queryId. Spodziewany argument 'string', wprowadzony '${typeof selectClass}'`);
            return;
        }
        
        if (typeof delay !== 'number') {
            console.error(`Wprowadzono niepoprawny typ argumentu delay. Spodziewany argument 'number', wprowadzony '${typeof selectClass}'`);
            return;
        }

        if (typeof limit !== 'number') {
            console.error(`Wprowadzono niepoprawny typ argumentu limit. Spodziewany argument 'number', wprowadzony '${typeof selectClass}'`);
            return;
        }

        if (!Array.isArray(queryParameters)) {
            console.error(`Niepoprawny argument "queryParameters". Oczekiwano tablicy, otrzymano:`, queryParameters);
            return;
        }

        $(selectClass).select2({
            ajax: {
                url: 'http://localhost:3000/api/query/' + queryId,
                dataType: 'json',
                delay: delay,
                traditional: true,
                data: function (params) {
                    var query = {
                        term: params.term || '',
                        page: params.page || 1,
                        limit: limit,
                        queryParameters: queryParameters
                    }

                    return query;
                },
                processResults: function (data, params) {
                    params.page = params.page || 1;
                    return data;
                },
                error: function (err) {
                    const message = err.responseJSON.error;
                        
                    alert(message);
                }
            }
        });
    }
}

window.eSel = new ESel();
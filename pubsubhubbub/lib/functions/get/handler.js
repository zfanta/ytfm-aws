import 'source-map-support/register';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
const get = async (event) => {
    return formatJSONResponse({
        message: `Hello ${event.body.name}, welcome to the exciting Serverless world!`,
        event,
    });
};
export const main = middyfy(get);
//# sourceMappingURL=handler.js.map
import fp from "fastify-plugin";
import { policyCheck } from "@spark/guardrails";

export default fp(async (app:any)=>{
	app.decorate('guardrails', {
		check: policyCheck
	});
}); 
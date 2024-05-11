#!/usr/bin/env node
import { DeepClient, parseJwt } from "@deep-foundation/deeplinks/imports/client.js";
import { generateApolloClient } from "@deep-foundation/hasura/client.js";
import _ from 'lodash';
let deepClient = {};
let conversation;
let message;
let reply;



const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsiYWRtaW4iXSwieC1oYXN1cmEtZGVmYXVsdC1yb2xlIjoiYWRtaW4iLCJ4LWhhc3VyYS11c2VyLWlkIjoiMzgwIn0sImlhdCI6MTcxNTM5MjQ2MX0.wVkBMuZhTTmYUUZ7Hgfy3UAMqrZQW5a_KP2AbjtNNZI';
let messageUser = 'кто ты?';
const spaceIdArgument  = '380';
let urn = 'https://3006-deepfoundation-dev-kz4yexqt6an.ws-eu111.gitpod.io';
let ssl;


const url_protocol = urn.match(/^(http:|https:)/)[0];
if (url_protocol === "https:") {
  ssl = true;
} else if (url_protocol === "http:") {
  ssl = false;
} else {
  throw new Error(`Unsupported protocol: ${url.protocol}`);
}

if (!urn.endsWith("/gql")) {
  urn += "/gql";
}
urn = urn.replace(/^https:\/\//, "");
urn.replace(/^http:\/\//, "");

const GQL_URN = process.env.GQL_URN || urn
const GQL_SSL = process.env.GQL_SSL || ssl;



async function start(){
    if(messageUser){
        deepClient = makeDeepClient(token);
        newMessage(messageUser, spaceIdArgument, deepClient);
    }
}
async function newMessage(messageUser, spaceIdArgument, deepClient){
    conversation = addedConversationLinks(deepClient);
    addedContainLinks(spaceIdArgument, conversation, deepClient);
    message = addedMessageLinks(deepClient, messageUser);
    addedContainLinks(spaceIdArgument, message, deepClient);
    reply = addedReplyLinks(deepClient, conversation, message);
    addedContainLinks(spaceIdArgument, reply, deepClient);
}

const makeDeepClient = token => {
    if (!token) throw new Error("No token provided")
    const decoded = parseJwt(token)
    const linkId = decoded.userId
    const apolloClient = generateApolloClient({
      path: GQL_URN,
      ssl: !!+GQL_SSL,
      token
    })
    const deepClient = new DeepClient({ apolloClient, linkId, token })
    //console.log(deepClient);
    return deepClient
  }


// contain
async function addedContainLinks(spaceIdArgument, linkArg, deep){
    const spaceId = spaceIdArgument || (await deep.id('deep', 'admin'));
    const containTypeId = await deep.id('@deep-foundation/core', 'Contain');
    //console.log(linkArg.id);
    const spaceContainlinkArg = (await deep.insert({
        from_id: spaceId,
        type_id: containTypeId,
        //string: { data: { value: name } },
        to_id: linkArg.id,
    }, { name: 'INSERT_CONTAIN' })).data[0];
    //console.log(spaceIdArgument, spaceContainSyncTextFile);
    return containTypeId;
}

// conversation
async function addedConversationLinks(deep){
    console.log("111111");
    const conversationLinkTypeId = await deep.id('@deep-foundation/chatgpt-azure', 'Conversation');
    console.log("222222");
    console.log(conversationLinkTypeId);
    const conversationLink = (await deep.insert({
        type_id: conversationLinkTypeId,
    }, { name: 'INSERT_HANDLER_CONVERSATION' })).data[0];
    //console.log(conversationLink);
    return conversationLink;
}

// message
async function addedMessageLinks(deep, messageText){
    const messageLinkTypeId = await deep.id('@deep-foundation/messaging', 'Message');
    console.log("3333");
    console.log(messageLinkTypeId);
    const messageLink = (await deep.insert({
        type_id: messageLinkTypeId,
    }, { name: 'INSERT_HANDLER_MESSAGE' })).data[0];
    console.log("4444");
    const messageLinkValue = (await deep.insert({ link_id: messageLink.id, value: messageText }, { table: 'strings' })).data[0];
    console.log("5555");
    console.log(messageText);
    return messageLink;
}

// reply
async function addedReplyLinks(deep, conversation, message){
    const replyLinkTypeId = await deep.id('@deep-foundation/messaging', 'Reply');
    const replyLink = (await deep.insert({
        type_id: replyLinkTypeId,
        from_id: message.id,
        to_id: conversation.id,
    }, { name: 'INSERT_HANDLER_REPLY' })).data[0];
    return replyLink;
}




start();

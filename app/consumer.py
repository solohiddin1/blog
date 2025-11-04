from channels.generic.websocket import AsyncWebsocketConsumer
import json

class CommentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.post_id = self.scope['url_route']['kwargs']['post_id']
        self.room_group_name = f'comments_{self.post_id}'

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data['content']
        author = data['author']

        # Broadcast the new comment to the group
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'comment_message',
            'content': content,
            'author': author,   
        })

    async def comment_message(self, event):
        content = event['content']
        author = event['author']

        # Send the comment to WebSocket
        await self.send(text_data=json.dumps({
            'content': content,
            'author': author,
        }))

# import json
# from channels.generic.websocket import WebsocketConsumer

# class Myconsumer(WebsocketConsumer):
#     def connect(self):
#         self.accept()
#         self.send(text_data=json.dumps({
#             'message':'new websocket'
#         }))

#     def disconnect(self, code):
#         pass

#     def receive(self, text_data = None):
#         pass
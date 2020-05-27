<script>
 import { db } from './global';

 let users = {};
 db.changes({
	 include_docs: true,
	 live: true,
	 selector: {
		 type: 'user',
	 }
 })
 .on('change', (change) => {
	 users[change.doc._id] = change.doc;
 })
 .on('complete', (change) => {
	 console.log(change);
 })
 .on('error', (change) => {
	 console.log(change);
 })

let userList
$: userList = Object.values(users);


</script>


{#each userList as u}
	<p>{u.name} --  {u.roles.join(',')}</p>
{/each}



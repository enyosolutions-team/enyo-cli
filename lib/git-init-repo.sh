#!/bin/sh

repo=$2
namespace=$1
token="Wcsj3RTKy-VKB8RBSWx7"
namespace_id=0
namespace_enyosolutions_clients='915620'
namespace_vyvop='871925'
namespace_kenweego='871924'

test -z $namespace && echo "Repo name required." 1>&2 && exit 1
test -z $repo && repo=$namespace && namespace="enyosolutions_clients"
namespace_id=`eval echo '$'namespace_$namespace`
echo "Creating repo $repo in namespace $namespace that has id $namespace_id  "
echo "{ \"name\": \"$repo\", \"namespace_id\": $namespace_id}"
curl -H "Content-Type:application/json" https://gitlab.com/api/v3/projects?private_token=$token -d "{ \"name\": \"$repo\", \"namespace_id\": $namespace_id}"

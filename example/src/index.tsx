import React from "react";
import { Button, Flex, Select } from "antd";
import { useState } from "react";
import { Region, regions } from "./region";
import { createRoom } from "./api";

const IndexPage = ()=>{
    const [region,setRegion] = useState<Region>('cn-hz');
    const [loading1,setLoading1] = useState<boolean>(false);
    // const navigate = useNavigate();
    const handleChange = (value: Region) => {
        setRegion(value);
    };
    async function go(hash:string){
        const room = await createRoom(region);
        const { roomToken,roomUUID } = room
        sessionStorage.setItem('uid','uid-1234')
        window.location.href= `${document.location.origin}${document.location.pathname}#${hash}?roomToken=${roomToken}&uuid=${roomUUID}`;
    }
    return <Flex justify="center" align="center" vertical style={{ position:'absolute',width:'100vw', height:'100vh' }}>
        <Flex style={{ width:200 }} vertical justify="center" align="center" gap='small'>
                <Select
                defaultValue="cn-hz"
                style={{ width: 120 }}
                onChange={handleChange}
                options={regions.map(v=>({ value:v.region,label:v.emoji + v.name }))}
                />
                <Button type="primary" block onClick={()=>{
                        if (!loading1) {
                            setLoading1(true);
                            go('/fastboard');
                        }
                    }} loading ={loading1}>
                        fastboard
                </Button>   
                <Button type="primary" block onClick={()=>{
                    if (!loading1) {
                        setLoading1(true);
                        go('/fastboard-react');
                    }
                }} loading ={loading1}>
                    fastboard-react
                </Button>

        </Flex>
    </Flex>
}
export default IndexPage;